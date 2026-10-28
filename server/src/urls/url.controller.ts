import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../auth/auth.middleware'
import { urlService } from './url.service'

const createUrlSchema = z.object({
  longUrl: z.string().url().refine((u) => /^https?:\/\//i.test(u), {
    message: 'longUrl must be http or https',
  }),
  campaign: z.string().optional(),
  expiresAt: z.coerce.date().refine((date) => date > new Date(), {
    message: 'expiresAt must be in the future',
  }).optional(),
})

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function listUrls(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { limit, offset } = listQuerySchema.parse(req.query)
    const urls = await urlService.list(req.userId!, limit, offset)
    res.json(urls)
  } catch (err) {
    next(err)
  }
}

export async function createShortUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { longUrl, campaign, expiresAt } = createUrlSchema.parse(req.body)
    const url = await urlService.create(longUrl, req.userId!, campaign, expiresAt)
    res.status(201).json(url)
  } catch (err) {
    next(err)
  }
}
