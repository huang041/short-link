export const config = {
  port: process.env.PORT || 3000,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
}
