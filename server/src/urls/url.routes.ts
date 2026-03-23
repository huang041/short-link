import { Router } from 'express'
import { createShortUrl, listUrls } from './url.controller'
import { rateLimit } from '../middlewares/rateLimit'

export const urlRoutes = Router()

urlRoutes.get('/', listUrls)
urlRoutes.post('/shorten', rateLimit({ windowSeconds: 60, max: 30, keyPrefix: 'shorten' }), createShortUrl)
