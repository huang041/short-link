import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

// Mock prisma and redis before importing url.service
vi.mock('../lib/prisma', () => ({
  prisma: {
    url: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    click: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../lib/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('../preview/og.service', () => ({
  ogService: {
    fetch: vi.fn().mockResolvedValue({}),
  },
}))

import { urlService } from './url.service'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'

const mockPrismaUrl = prisma.url as unknown as {
  create: ReturnType<typeof vi.fn>
  findMany: ReturnType<typeof vi.fn>
  findUnique: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

const mockRedis = redis as unknown as {
  get: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
  del: ReturnType<typeof vi.fn>
}

const fakeUrl = {
  id: 'cuid123',
  shortCode: 'abc1234',
  longUrl: 'https://example.com',
  campaign: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  expiresAt: null,
  isActive: true,
  userId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('urlService.create', () => {
  it('creates a short URL and caches it', async () => {
    mockPrismaUrl.create.mockResolvedValueOnce(fakeUrl)
    mockRedis.set.mockResolvedValueOnce('OK')

    const result = await urlService.create('https://example.com')

    expect(mockPrismaUrl.create).toHaveBeenCalledOnce()
    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^url:[a-zA-Z0-9]{7}$/),
      JSON.stringify(fakeUrl),
      { EX: 3600 },
    )
    expect(result.longUrl).toBe('https://example.com')
  })

  it('passes expiresAt through to prisma.create', async () => {
    const expiresAt = new Date('2099-01-01')
    mockPrismaUrl.create.mockResolvedValueOnce({ ...fakeUrl, expiresAt })
    mockRedis.set.mockResolvedValueOnce('OK')

    await urlService.create('https://example.com', undefined, expiresAt)

    expect(mockPrismaUrl.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ expiresAt }),
    })
  })

  it('retries on P2002 unique constraint violation', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '6.0.0',
    })
    mockPrismaUrl.create
      .mockRejectedValueOnce(p2002)
      .mockResolvedValueOnce(fakeUrl)

    mockRedis.set.mockResolvedValueOnce('OK')

    const result = await urlService.create('https://example.com')

    expect(mockPrismaUrl.create).toHaveBeenCalledTimes(2)
    expect(result.shortCode).toBe(fakeUrl.shortCode)
  })

  it('throws after exceeding max retries', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '6.0.0',
    })
    mockPrismaUrl.create.mockRejectedValue(p2002)

    await expect(urlService.create('https://example.com')).rejects.toThrow(
      'Failed to generate unique short code',
    )
    expect(mockPrismaUrl.create).toHaveBeenCalledTimes(3)
  })

  it('rethrows non-P2002 errors immediately', async () => {
    mockPrismaUrl.create.mockRejectedValueOnce(new Error('DB connection error'))

    await expect(urlService.create('https://example.com')).rejects.toThrow('DB connection error')
    expect(mockPrismaUrl.create).toHaveBeenCalledOnce()
  })
})

describe('urlService.findByCode', () => {
  it('returns cached URL from Redis', async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify(fakeUrl))

    const result = await urlService.findByCode('abc1234')

    expect(mockRedis.get).toHaveBeenCalledWith('url:abc1234')
    expect(mockPrismaUrl.findUnique).not.toHaveBeenCalled()
    expect(result?.shortCode).toBe('abc1234')
  })

  it('falls back to DB and caches result on cache miss', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockPrismaUrl.findUnique.mockResolvedValueOnce(fakeUrl)
    mockRedis.set.mockResolvedValueOnce('OK')

    const result = await urlService.findByCode('abc1234')

    expect(mockPrismaUrl.findUnique).toHaveBeenCalledOnce()
    expect(mockRedis.set).toHaveBeenCalledWith('url:abc1234', JSON.stringify(fakeUrl), { EX: 3600 })
    expect(result?.shortCode).toBe('abc1234')
  })

  it('returns null for non-existent code', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockPrismaUrl.findUnique.mockResolvedValueOnce(null)

    const result = await urlService.findByCode('notfound')
    expect(result).toBeNull()
  })

  it('returns null for expired URL served from cache', async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({ ...fakeUrl, expiresAt: new Date('2000-01-01') }),
    )

    const result = await urlService.findByCode('abc1234')
    expect(result).toBeNull()
  })

  it('returns null for expired URL', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockPrismaUrl.findUnique.mockResolvedValueOnce({
      ...fakeUrl,
      expiresAt: new Date('2000-01-01'),
    })

    const result = await urlService.findByCode('abc1234')
    expect(result).toBeNull()
  })
})

describe('urlService.findByCode (inactive)', () => {
  it('returns null for inactive URL from DB', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockPrismaUrl.findUnique.mockResolvedValueOnce({ ...fakeUrl, isActive: false })
    expect(await urlService.findByCode('abc1234')).toBeNull()
    expect(mockRedis.set).not.toHaveBeenCalled()
  })

  it('returns null for inactive URL from cache', async () => {
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ ...fakeUrl, isActive: false }))
    expect(await urlService.findByCode('abc1234')).toBeNull()
  })
})

describe('urlService.update', () => {
  it('updates owned URL and invalidates cache', async () => {
    mockPrismaUrl.findUnique.mockResolvedValueOnce(fakeUrl)
    mockPrismaUrl.update.mockResolvedValueOnce({ ...fakeUrl, isActive: false })

    const result = await urlService.update('abc1234', 'user1', { isActive: false })

    expect(mockPrismaUrl.update).toHaveBeenCalledWith({
      where: { shortCode: 'abc1234' },
      data: { isActive: false },
    })
    expect(mockRedis.del).toHaveBeenCalledWith('url:abc1234')
    expect(result.isActive).toBe(false)
  })

  it('rejects with 404 when URL belongs to someone else', async () => {
    mockPrismaUrl.findUnique.mockResolvedValueOnce(fakeUrl)
    await expect(urlService.update('abc1234', 'other', { isActive: false })).rejects.toMatchObject({
      statusCode: 404,
    })
    expect(mockPrismaUrl.update).not.toHaveBeenCalled()
  })
})

describe('urlService.remove', () => {
  it('deletes owned URL with its clicks and invalidates cache', async () => {
    mockPrismaUrl.findUnique.mockResolvedValueOnce(fakeUrl)
    ;(prisma.$transaction as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])

    await urlService.remove('abc1234', 'user1')

    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(mockRedis.del).toHaveBeenCalledWith('url:abc1234')
  })

  it('rejects with 404 for anonymous (userId null) URL', async () => {
    mockPrismaUrl.findUnique.mockResolvedValueOnce({ ...fakeUrl, userId: null })
    await expect(urlService.remove('abc1234', 'user1')).rejects.toMatchObject({ statusCode: 404 })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
