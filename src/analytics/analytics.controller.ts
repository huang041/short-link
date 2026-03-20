import { Request, Response, NextFunction } from 'express'
import { analyticsService } from './analytics.service'

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const shortCode = req.params.shortCode as string
    const stats = await analyticsService.getStats(shortCode)
    res.json(stats)
  } catch (err) {
    next(err)
  }
}
