import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

const MAX_RETRIES = 3

export const referralService = {
  async create(userId: string) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase()
        return await prisma.referral.create({
          data: { code, userId },
        })
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          continue
        }
        throw err
      }
    }
    throw new Error('Failed to generate unique referral code')
  },

  async listByUser(userId: string) {
    return prisma.referral.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },
}
