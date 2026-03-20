import { urlService } from '../urls/url.service'
import { analyticsService } from '../analytics/analytics.service'

export const redirectService = {
  async handle(shortCode: string, ctx: { ip?: string; userAgent?: string; referer?: string; referralCode?: string }) {
    const url = await urlService.findByCode(shortCode)
    if (!url) throw new Error('URL not found')

    // fire-and-forget analytics
    analyticsService.record({
      shortCode,
      ...ctx,
    }).catch(console.error)

    return url.longUrl
  },
}
