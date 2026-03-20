import { prisma } from '../lib/prisma'
import { ClickEvent } from '../types'

export const analyticsService = {
  async record(event: ClickEvent) {
    await prisma.click.create({
      data: {
        urlId: event.urlId,
        referralCode: event.referralCode,
        ip: event.ip,
        userAgent: event.userAgent,
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
