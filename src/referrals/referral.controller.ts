import { Response, NextFunction } from 'express'
import { AuthRequest } from '../auth/auth.middleware'
import { referralService } from './referral.service'

export async function createReferral(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const referral = await referralService.create(req.userId!)
    res.status(201).json(referral)
  } catch (err) {
    next(err)
  }
}

export async function listReferrals(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const referrals = await referralService.listByUser(req.userId!)
    res.json(referrals)
  } catch (err) {
    next(err)
  }
}
