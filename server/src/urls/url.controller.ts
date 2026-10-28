import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { urlService } from './url.service'

const createUrlSchema = z.object({
  longUrl: z.string().url(),
  campaign: z.string().optional(),
  expiresAt: z.coerce.date().refine((date) => date > new Date(), {
    message: 'expiresAt must be in the future',
  }).optional(),
})

export async function listUrls(req: Request, res: Response, next: NextFunction) {
  try {
    const urls = await urlService.list()
    res.json(urls)
  } catch (err) {
    next(err)
  }
}

export async function createShortUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { longUrl, campaign, expiresAt } = createUrlSchema.parse(req.body)
    const url = await urlService.create(longUrl, campaign, expiresAt)
    res.status(201).json(url)
  } catch (err) {
    next(err)
  }
}
