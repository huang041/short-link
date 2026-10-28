import { randomInt } from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'
import { ogService } from '../preview/og.service'
import type { Url } from '@prisma/client'

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const SHORT_CODE_LENGTH = 7
const CACHE_TTL = 3600 // 1 hour
const MAX_RETRIES = 3
const DEFAULT_PAGE_SIZE = 50

function generateShortCode(): string {
  let code = ''
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += BASE62[randomInt(BASE62.length)]
  }
  return code
}

// don't keep a URL cached past its expiry
function cacheTtl(url: Url): number {
  if (!url.expiresAt) return CACHE_TTL
  const remaining = Math.ceil((new Date(url.expiresAt).getTime() - Date.now()) / 1000)
  return Math.max(1, Math.min(CACHE_TTL, remaining))
}

async function fetchAndStoreOgTags(urlId: string, longUrl: string) {
  const ogTags = await ogService.fetch(longUrl)
  await prisma.url.update({
    where: { id: urlId },
    data: {
      ogTitle: ogTags.title,
      ogDescription: ogTags.description,
      ogImage: ogTags.image,
    },
  })
}

export const urlService = {
  async create(longUrl: string, userId: string, campaign?: string, expiresAt?: Date): Promise<Url> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const shortCode = generateShortCode()
        const url = await prisma.url.create({
          data: { shortCode, longUrl, campaign, expiresAt, userId },
        })

        await redis.set(`url:${shortCode}`, JSON.stringify(url), { EX: cacheTtl(url) })

        // fire-and-forget OG tag fetch
        fetchAndStoreOgTags(url.id, longUrl).catch(console.error)

        return url
      } catch (err) {
        // P2002 = unique constraint violation → retry with new code
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          continue
        }
        throw err
      }
    }
    throw new Error('Failed to generate unique short code')
  },

  async list(userId: string, limit = DEFAULT_PAGE_SIZE, offset = 0): Promise<Url[]> {
    return prisma.url.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  },

  async findByCode(shortCode: string): Promise<Url | null> {
    const cached = await redis.get(`url:${shortCode}`)
    if (cached) {
      const url = JSON.parse(cached) as Url
      // expiresAt is a string after JSON round-trip; check on every hit
      if (url.expiresAt && new Date(url.expiresAt) < new Date()) return null
      return url
    }

    const url = await prisma.url.findUnique({ where: { shortCode } })
    if (!url) return null

    if (url.expiresAt && url.expiresAt < new Date()) return null

    await redis.set(`url:${shortCode}`, JSON.stringify(url), { EX: cacheTtl(url) })
    return url
  },
}
