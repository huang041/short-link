import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash,
      referrals: {
        create: { code: 'ADMIN' },
      },
    },
  })

  console.log(`Admin user created: ${admin.email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
