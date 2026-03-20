import { Request, Response, NextFunction } from 'express'
import { redirectService } from './redirect.service'

export async function handleRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const shortCode = req.params.shortCode as string
    const userAgent = req.headers['user-agent'] || ''
    const referer = Array.isArray(req.headers['referer'])
      ? req.headers['referer'][0]
      : req.headers['referer']

    // TODO: detect social bot → serve OG preview HTML instead of redirect
    await redirectService.handle(shortCode, {
      ip: req.ip,
      userAgent,
      referer,
    })
    // TODO: res.redirect(302, longUrl)
  } catch (err) {
    next(err)
  }
}
