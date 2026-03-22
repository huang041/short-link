import { Router } from 'express'
import { getStats, getStatsByLongUrl } from './analytics.controller'

export const analyticsRoutes = Router()

analyticsRoutes.get('/url', getStatsByLongUrl)  // 放在 /:shortCode 前面，避免被 catch
analyticsRoutes.get('/:shortCode', getStats)
