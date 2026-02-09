import type { FastifyInstance } from 'fastify'

import { healthRoutes } from './healthRoutes.js'
import { authRoutes } from './authRoutes.js'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/auth' })
}
