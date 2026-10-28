import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware'
import { getStats, getStatsByLongUrl } from './analytics.controller'

export const analyticsRoutes = Router()

analyticsRoutes.use(requireAuth as any)

analyticsRoutes.get('/url', getStatsByLongUrl)  // 放在 /:shortCode 前面，避免被 catch
analyticsRoutes.get('/:shortCode', getStats)
