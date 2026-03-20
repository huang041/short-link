import { Request, Response, NextFunction } from 'express'
import { urlService } from './url.service'

export async function createShortUrl(req: Request, res: Response, next: NextFunction) {
  try {
    // TODO: validate with zod
    const { longUrl, referralCode } = req.body
    const result = await urlService.create(longUrl, referralCode)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}
