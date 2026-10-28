import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { urlService } from './url.service'
import type { AuthRequest } from '../auth/auth.middleware'

const futureDate = z.coerce.date().refine((date) => date > new Date(), {
  message: 'expiresAt must be in the future',
})

const createUrlSchema = z.object({
  longUrl: z.string().url(),
  campaign: z.string().optional(),
  expiresAt: futureDate.optional(),
})

const updateUrlSchema = z
  .object({
    longUrl: z.string().url().optional(),
    campaign: z.string().nullable().optional(),
    expiresAt: futureDate.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })

export async function listUrls(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const urls = await urlService.list(req.userId!)
    res.json(urls)
  } catch (err) {
    next(err)
  }
}

export async function createShortUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { longUrl, campaign, expiresAt } = createUrlSchema.parse(req.body)
    const url = await urlService.create(longUrl, campaign, expiresAt, req.userId)
    res.status(201).json(url)
  } catch (err) {
    next(err)
  }
}

export async function updateUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateUrlSchema.parse(req.body)
    const url = await urlService.update(req.params.shortCode as string, req.userId!, data)
    res.json(url)
  } catch (err) {
    next(err)
  }
}

export async function deleteUrl(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await urlService.remove(req.params.shortCode as string, req.userId!)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
