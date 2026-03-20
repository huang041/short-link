import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'
import type { Url } from '@prisma/client'

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const SHORT_CODE_LENGTH = 7
const CACHE_TTL = 3600 // 1 hour
const MAX_RETRIES = 3

function generateShortCode(): string {
  let code = ''
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += BASE62[Math.floor(Math.random() * 62)]
  }
  return code
}

export const urlService = {
  async create(longUrl: string, campaign?: string): Promise<Url> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const shortCode = generateShortCode()
        const url = await prisma.url.create({
          data: { shortCode, longUrl, campaign },
        })

        await redis.set(`url:${shortCode}`, JSON.stringify(url), { EX: CACHE_TTL })

        // TODO: trigger OG tag fetch in background

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

  async findByCode(shortCode: string): Promise<Url | null> {
    const cached = await redis.get(`url:${shortCode}`)
    if (cached) return JSON.parse(cached) as Url

    const url = await prisma.url.findUnique({ where: { shortCode } })
    if (!url) return null

    if (url.expiresAt && url.expiresAt < new Date()) return null

    await redis.set(`url:${shortCode}`, JSON.stringify(url), { EX: CACHE_TTL })
    return url
  },
}
