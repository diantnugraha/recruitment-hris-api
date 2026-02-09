import type { FastifyInstance } from 'fastify'

import { healthRoutes } from './healthRoutes.js'
import { authRoutes } from './authRoutes.js'
import { userRestRoutes } from './userRestRoutes.js'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(userRestRoutes, { prefix: '/v1/user-rest' })
}
