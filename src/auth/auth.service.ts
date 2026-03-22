import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { config } from '../config'

export const authService = {
  async register(name: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    })
    return { id: user.id, name: user.name, email: user.email }
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('Invalid email or password')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error('Invalid email or password')

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' })
    return { token, user: { id: user.id, name: user.name, email: user.email } }
  },
}
