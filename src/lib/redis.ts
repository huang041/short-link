import { createClient } from 'redis'
import { config } from '../config'

export const redis = createClient({ url: config.redisUrl })

redis.on('error', (err) => console.error('Redis error:', err))

export async function connectRedis() {
  await redis.connect()
}
