import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { config } from '../config'
import { AppError } from '../middlewares/errorHandler'

export const authService = {
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError(409, 'Email already registered')

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    })
    return { id: user.id, name: user.name, email: user.email }
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new AppError(401, 'Invalid email or password')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new AppError(401, 'Invalid email or password')

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' })
    return { token, user: { id: user.id, name: user.name, email: user.email } }
  },
}
