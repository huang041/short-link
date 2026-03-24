import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/prisma', () => ({
  prisma: {
    click: {
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    url: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('geoip-lite', () => ({
  default: {
    lookup: vi.fn(),
  },
}))

import { analyticsService } from './analytics.service'
import { prisma } from '../lib/prisma'
import geoip from 'geoip-lite'

const mockClick = prisma.click as {
  create: ReturnType<typeof vi.fn>
  count: ReturnType<typeof vi.fn>
  groupBy: ReturnType<typeof vi.fn>
}

const mockGeoip = geoip as { lookup: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('analyticsService.record', () => {
  it('creates a click record with parsed UA and country', async () => {
    mockGeoip.lookup.mockReturnValueOnce({ country: 'TW' })
    mockClick.create.mockResolvedValueOnce({})

    await analyticsService.record({
      urlId: 'url1',
      ip: '1.2.3.4',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      referralCode: 'REF001',
      referer: 'https://google.com',
    })

    expect(mockClick.create).toHaveBeenCalledOnce()
    const data = mockClick.create.mock.calls[0][0].data
    expect(data.urlId).toBe('url1')
    expect(data.country).toBe('TW')
    expect(data.browser).toBe('Chrome')
    expect(data.os).toBe('macOS')
  })

  it('handles missing UA and IP gracefully', async () => {
    mockGeoip.lookup.mockReturnValueOnce(null)
    mockClick.create.mockResolvedValueOnce({})

    await analyticsService.record({ urlId: 'url1' })

    const data = mockClick.create.mock.calls[0][0].data
    expect(data.country).toBeUndefined()
    expect(data.browser).toBeUndefined()
    expect(data.device).toBeUndefined()
  })
})
