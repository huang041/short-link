import { Request, Response, NextFunction } from 'express'
import { redirectService } from './redirect.service'
import { isSocialBot } from '../preview/bot'
import { ogService } from '../preview/og.service'
import { urlService } from '../urls/url.service'

export async function handleRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const shortCode = req.params.shortCode as string
    const userAgent = req.headers['user-agent'] || ''
    const referer = Array.isArray(req.headers['referer'])
      ? req.headers['referer'][0]
      : req.headers['referer']
    const referralCode = req.query.ref as string | undefined

    // social bot → serve OG preview HTML
    if (isSocialBot(userAgent)) {
      const url = await urlService.findByCode(shortCode)
      if (!url) return res.status(404).send('Not found')

      const ogTags = {
        title: url.ogTitle || undefined,
        description: url.ogDescription || undefined,
        image: url.ogImage || undefined,
      }
      const html = ogService.buildPreviewHtml(ogTags, url.longUrl)
      return res.type('html').send(html)
    }

    // normal user → 302 redirect
    const longUrl = await redirectService.handle(shortCode, {
      ip: req.ip,
      userAgent,
      referer,
      referralCode,
    })
    res.redirect(302, longUrl)
  } catch (err) {
    next(err)
  }
}
