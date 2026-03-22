import { Router } from 'express'
import { requireAuth } from '../auth/auth.middleware'
import { createReferral, listReferrals } from './referral.controller'

export const referralRoutes = Router()

referralRoutes.use(requireAuth as any)
referralRoutes.post('/', createReferral as any)
referralRoutes.get('/', listReferrals as any)
