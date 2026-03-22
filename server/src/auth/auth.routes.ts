import { Router } from 'express'
import { register, login } from './auth.controller'
import { rateLimit } from '../middlewares/rateLimit'

export const authRoutes = Router()

authRoutes.post('/register', rateLimit({ windowSeconds: 60, max: 5, keyPrefix: 'register' }), register)
authRoutes.post('/login', rateLimit({ windowSeconds: 60, max: 10, keyPrefix: 'login' }), login)
