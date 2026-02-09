import type { FastifyInstance } from 'fastify'

import * as healthController from '../controllers/healthController.js'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', healthController.checkHealth)
}
