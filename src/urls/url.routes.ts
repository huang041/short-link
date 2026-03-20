import { Router } from 'express'
import { createShortUrl } from './url.controller'

export const urlRoutes = Router()

urlRoutes.post('/shorten', createShortUrl)
