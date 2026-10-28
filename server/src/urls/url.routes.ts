import { Router } from 'express'
import { createShortUrl, deleteUrl, listUrls, updateUrl } from './url.controller'
import { optionalAuth, requireAuth } from '../auth/auth.middleware'
import { rateLimit } from '../middlewares/rateLimit'

export const urlRoutes = Router()

urlRoutes.get('/', requireAuth as any, listUrls as any)
// 登入時綁定 userId，未登入維持匿名建立
urlRoutes.post('/shorten', optionalAuth as any, rateLimit({ windowSeconds: 60, max: 30, keyPrefix: 'shorten' }), createShortUrl as any)
urlRoutes.patch('/:shortCode', requireAuth as any, updateUrl as any)
urlRoutes.delete('/:shortCode', requireAuth as any, deleteUrl as any)
