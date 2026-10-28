import { UAParser } from 'ua-parser-js'
import geoip from 'geoip-lite'
import { prisma } from '../lib/prisma'
import { ClickEvent } from '../types'

function parseDevice(userAgent?: string) {
  if (!userAgent) return {}
  const result = UAParser(userAgent)
  return {
    device: result.device.type || 'desktop',
    browser: result.browser.name,
    os: result.os.name,
  }
}

function lookupCountry(ip?: string): string | undefined {
  if (!ip) return undefined
  const geo = geoip.lookup(ip)
  return geo?.country
}

async function dbGroupBy(urlIds: string[], field: 'device' | 'country' | 'browser' | 'referralCode') {
  const groups = await prisma.click.groupBy({
    by: [field],
    where: { urlId: { in: urlIds } },
    _count: true,
  })
  const result: Record<string, number> = {}
  for (const g of groups) {
    result[g[field] || 'unknown'] = g._count
  }
  return result
}

async function dbGroupByDate(urlIds: string[]): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("clickedAt")::text as date, COUNT(*) as count
    FROM "clicks"
    WHERE "urlId" = ANY(${urlIds})
    GROUP BY date ORDER BY date
  `
  const result: Record<string, number> = {}
  for (const row of rows) {
    result[row.date] = Number(row.count)
  }
  return result
}

export const analyticsService = {
  async record(event: ClickEvent) {
    const { device, browser, os } = parseDevice(event.userAgent)
    const country = lookupCountry(event.ip)

    await prisma.click.create({
      data: {
        urlId: event.urlId,
        referralCode: event.referralCode,
        ip: event.ip,
        userAgent: event.userAgent,
        device,
        browser,
        os,
        referer: event.referer,
        country,
      },
    })
  },

  async getStats(shortCode: string, userId: string) {
    const url = await prisma.url.findUnique({ where: { shortCode } })
    // treat other users' URLs as not found
    if (!url || url.userId !== userId) return null

    const urlIds = [url.id]
    const [totalClicks, byDevice, byCountry, byBrowser, byReferrer, byDate] = await Promise.all([
      prisma.click.count({ where: { urlId: url.id } }),
      dbGroupBy(urlIds, 'device'),
      dbGroupBy(urlIds, 'country'),
      dbGroupBy(urlIds, 'browser'),
      dbGroupBy(urlIds, 'referralCode'),
      dbGroupByDate(urlIds),
    ])

    return { totalClicks, campaign: url.campaign, byDevice, byCountry, byBrowser, byReferrer, byDate }
  },

  async getStatsByLongUrl(longUrl: string, userId: string) {
    const urls = await prisma.url.findMany({
      where: { longUrl, userId },
      select: { id: true, shortCode: true, campaign: true },
    })
    if (urls.length === 0) return null

    const urlIds = urls.map((u) => u.id)
    const [totalClicks, byDevice, byCountry, byBrowser, byReferrer, byDate] = await Promise.all([
      prisma.click.count({ where: { urlId: { in: urlIds } } }),
      dbGroupBy(urlIds, 'device'),
      dbGroupBy(urlIds, 'country'),
      dbGroupBy(urlIds, 'browser'),
      dbGroupBy(urlIds, 'referralCode'),
      dbGroupByDate(urlIds),
    ])

    const byCampaignRows = await prisma.$queryRaw<{ campaign: string; count: bigint }[]>`
      SELECT COALESCE(u."campaign", 'none') as campaign, COUNT(*) as count
      FROM "clicks" c JOIN "urls" u ON c."urlId" = u."id"
      WHERE c."urlId" = ANY(${urlIds})
      GROUP BY campaign
    `
    const byCampaign: Record<string, number> = {}
    for (const row of byCampaignRows) {
      byCampaign[row.campaign] = Number(row.count)
    }

    return {
      longUrl,
      totalClicks,
      shortUrls: urls.map((u) => ({ shortCode: u.shortCode, campaign: u.campaign })),
      byCampaign,
      byDevice,
      byCountry,
      byBrowser,
      byReferrer,
      byDate,
    }
  },
}
