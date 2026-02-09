import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

import { errorHandler } from '../middlewares/errorHandler.js'
import { registerRoutes } from '../routes/index.js'

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'production'
  })

  // Security plugins
  await app.register(helmet)
  await app.register(cors)

  // Error handler
  app.setErrorHandler(errorHandler)

  // Routes
  await registerRoutes(app)

  return app
}
