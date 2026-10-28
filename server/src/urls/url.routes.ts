import { Router } from 'express'
import { createShortUrl, listUrls } from './url.controller'
import { requireAuth } from '../auth/auth.middleware'
import { rateLimit } from '../middlewares/rateLimit'

export const urlRoutes = Router()

urlRoutes.use(requireAuth as any)
urlRoutes.get('/', listUrls)
urlRoutes.post('/shorten', rateLimit({ windowSeconds: 60, max: 30, keyPrefix: 'shorten' }), createShortUrl)
