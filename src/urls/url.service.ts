import { prisma } from '../lib/prisma'

export const urlService = {
  async create(longUrl: string, referralCode?: string) {
    // TODO: implement short code generation
    // TODO: trigger OG tag fetch in background
    throw new Error('Not implemented')
  },

  async findByCode(shortCode: string): Promise<{ longUrl: string; referralCode?: string } | null> {
    // TODO: check Redis cache first, then DB
    throw new Error('Not implemented')
  },
}
