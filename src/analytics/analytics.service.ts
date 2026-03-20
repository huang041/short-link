import { prisma } from '../lib/prisma'
import { ClickEvent } from '../types'

export const analyticsService = {
  async record(event: ClickEvent) {
    // TODO: write click event to DB
    throw new Error('Not implemented')
  },

  async getStats(shortCode: string) {
    // TODO: aggregate clicks by platform, country, referral
    throw new Error('Not implemented')
  },
}
