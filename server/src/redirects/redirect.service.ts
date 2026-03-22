import { urlService } from '../urls/url.service'
import { clickQueue } from '../lib/queue'
import { AppError } from '../middlewares/errorHandler'

export const redirectService = {
  async handle(shortCode: string, ctx: { ip?: string; userAgent?: string; referer?: string; referralCode?: string }) {
    const url = await urlService.findByCode(shortCode)
    if (!url) throw new AppError(404, 'URL not found')

    // enqueue click event, worker writes to DB asynchronously
    clickQueue.add('click', { urlId: url.id, ...ctx }).catch(console.error)

    return url.longUrl
  },
}
