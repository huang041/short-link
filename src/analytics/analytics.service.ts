import UAParser from 'ua-parser-js'
import geoip from 'geoip-lite'
import { prisma } from '../lib/prisma'
import { ClickEvent } from '../types'

function parseDevice(userAgent?: string) {
  if (!userAgent) return {}
  const ua = new UAParser(userAgent)
  return {
    device: ua.getDevice().type || 'desktop',
    browser: ua.getBrowser().name,
    os: ua.getOS().name,
  }
}

function lookupCountry(ip?: string): string | undefined {
  if (!ip) return undefined
  const geo = geoip.lookup(ip)
  return geo?.country
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

  async getStats(shortCode: string) {
    // TODO: aggregate clicks by platform, country, referral
    throw new Error('Not implemented')
  },
}
