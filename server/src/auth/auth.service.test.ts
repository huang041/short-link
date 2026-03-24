import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { authService } from './auth.service'
import { prisma } from '../lib/prisma'
import { AppError } from '../middlewares/errorHandler'

const mockUser = prisma.user as {
  findUnique: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
}

const fakeUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: bcrypt.hashSync('password123', 10),
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authService.register', () => {
  it('creates a new user and returns without passwordHash', async () => {
    mockUser.findUnique.mockResolvedValueOnce(null)
    mockUser.create.mockResolvedValueOnce(fakeUser)

    const result = await authService.register('Test User', 'test@example.com', 'password123')

    expect(result).toEqual({ id: fakeUser.id, name: fakeUser.name, email: fakeUser.email })
    expect(result).not.toHaveProperty('passwordHash')
  })

  it('throws 409 when email already exists', async () => {
    mockUser.findUnique.mockResolvedValueOnce(fakeUser)

    await expect(authService.register('Test User', 'test@example.com', 'password123')).rejects.toThrow(
      new AppError(409, 'Email already registered'),
    )
    expect(mockUser.create).not.toHaveBeenCalled()
  })
})

describe('authService.login', () => {
  it('returns token and user on valid credentials', async () => {
    mockUser.findUnique.mockResolvedValueOnce(fakeUser)

    const result = await authService.login('test@example.com', 'password123')

    expect(result).toHaveProperty('token')
    expect(result.user.email).toBe('test@example.com')
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('throws 401 when user does not exist', async () => {
    mockUser.findUnique.mockResolvedValueOnce(null)

    await expect(authService.login('notfound@example.com', 'password123')).rejects.toThrow(
      new AppError(401, 'Invalid email or password'),
    )
  })

  it('throws 401 when password is wrong', async () => {
    mockUser.findUnique.mockResolvedValueOnce(fakeUser)

    await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
      new AppError(401, 'Invalid email or password'),
    )
  })
})
