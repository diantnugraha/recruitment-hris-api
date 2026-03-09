import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'

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
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3001',  // Main HRIS frontend
      'http://localhost:3002',  // Candidate portal
    ],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  })
  await app.register(helmet)

  // Multipart file upload support
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
      files: 1, // 1 file per request
    },
  })

  // Error handler
  app.setErrorHandler(errorHandler)

  // Routes
  await registerRoutes(app)

  return app
}
