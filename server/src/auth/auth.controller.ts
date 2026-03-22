import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authService } from './auth.service'

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body)
    const user = await authService.register(data.name, data.email, data.password)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body)
    const result = await authService.login(data.email, data.password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
