import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

import { errorHandler } from '../middlewares/errorHandler.js'
import { registerRoutes } from '../routes/index.js'

// BigInt serialization support for JSON
declare global {
  interface BigInt {
    toJSON(): number
  }
}

BigInt.prototype.toJSON = function () {
  return Number(this)
}

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'production'
  })

  // CORS must be registered before helmet
  await app.register(cors, {
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  })
  await app.register(helmet)

  // Error handler
  app.setErrorHandler(errorHandler)

  // Routes
  await registerRoutes(app)

  return app
}
