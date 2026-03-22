import { urlService } from '../urls/url.service'
import { analyticsService } from '../analytics/analytics.service'
import { AppError } from '../middlewares/errorHandler'

export const redirectService = {
  async handle(shortCode: string, ctx: { ip?: string; userAgent?: string; referer?: string; referralCode?: string }) {
    const url = await urlService.findByCode(shortCode)
    if (!url) throw new AppError(404, 'URL not found')

    // fire-and-forget analytics
    analyticsService.record({
      urlId: url.id,
      ...ctx,
    }).catch(console.error)

    return url.longUrl
  },
}
