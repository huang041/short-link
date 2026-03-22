import UAParser from 'ua-parser-js'
import { prisma } from '../lib/prisma'
import { ClickEvent } from '../types'

function parseDevice(userAgent?: string) {
  if (!userAgent) return {}
  const ua = new UAParser(userAgent)
  return {
    device: ua.getDevice().type || 'desktop', // mobile, tablet, or fallback to desktop
    browser: ua.getBrowser().name,
    os: ua.getOS().name,
  }
}

export const analyticsService = {
  async record(event: ClickEvent) {
    const { device, browser, os } = parseDevice(event.userAgent)

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
        country: event.country,
      },
    })
  },

  async getStats(shortCode: string) {
    // TODO: aggregate clicks by platform, country, referral
    throw new Error('Not implemented')
  },
}
