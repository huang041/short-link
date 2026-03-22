import { Request, Response, NextFunction } from 'express'
import { redis } from '../lib/redis'

interface RateLimitOptions {
  windowSeconds: number
  max: number
  keyPrefix: string
}

export function rateLimit({ windowSeconds, max, keyPrefix }: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown'
    const key = `rl:${keyPrefix}:${identifier}`

    try {
      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, windowSeconds)
      }
      res.setHeader('X-RateLimit-Limit', max)
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count))

      if (count > max) {
        res.status(429).json({ error: 'Too many requests, please try again later' })
        return
      }
      next()
    } catch {
      // Redis down → don't block requests
      next()
    }
  }
}
