import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { urlService } from './url.service'

const createUrlSchema = z.object({
  longUrl: z.string().url(),
  campaign: z.string().optional(),
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
    const { longUrl, campaign } = createUrlSchema.parse(req.body)
    const url = await urlService.create(longUrl, campaign)
    res.status(201).json(url)
  } catch (err) {
    next(err)
  }
}
