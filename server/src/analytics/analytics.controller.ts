import { Response, NextFunction } from 'express'
import { AuthRequest } from '../auth/auth.middleware'
import { analyticsService } from './analytics.service'

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const shortCode = req.params.shortCode as string
    const stats = await analyticsService.getStats(shortCode, req.userId!)
    if (!stats) {
      res.status(404).json({ error: 'URL not found' })
      return
    }
    res.json(stats)
  } catch (err) {
    next(err)
  }
}

export async function getStatsByLongUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const longUrl = req.query.longUrl as string
    if (!longUrl) {
      res.status(400).json({ error: 'Missing longUrl query parameter' })
      return
    }
    const stats = await analyticsService.getStatsByLongUrl(longUrl, req.userId!)
    if (!stats) {
      res.status(404).json({ error: 'No short URLs found for this URL' })
      return
    }
    res.json(stats)
  } catch (err) {
    next(err)
  }
}
