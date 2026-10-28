const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production')
}

export const config = {
  port: process.env.PORT || 3000,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  jwtSecret: jwtSecret || 'change-me-in-development',
}
