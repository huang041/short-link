import { Router } from 'express'
import { getStats } from './analytics.controller'

export const analyticsRoutes = Router()

analyticsRoutes.get('/:shortCode', getStats)
