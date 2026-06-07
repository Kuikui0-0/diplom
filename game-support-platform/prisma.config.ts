// prisma.config.ts
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasources: {
    db: {
      directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})