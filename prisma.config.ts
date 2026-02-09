import path from 'node:path'
import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),

  migrate: {
    async adapter() {
      const { PrismaMariaDb } = await import('@prisma/adapter-mariadb')
      return new PrismaMariaDb({
        url: process.env.DATABASE_URL!,
      })
    },
  },
})
