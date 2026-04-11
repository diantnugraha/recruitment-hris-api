import type { FastifyInstance } from 'fastify'

import * as authController from '../controllers/authController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import {
  LoginBodySchema,
  RegisterBodySchema,
  type LoginBody,
  type RegisterBody
} from '../schemas/authSchemas.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RegisterBody }>(
    '/register',
    { schema: { body: RegisterBodySchema } },
    authController.register
  )

  app.post<{ Body: LoginBody }>(
    '/login',
    { schema: { body: LoginBodySchema } },
    authController.login
  )

  app.get(
    '/me',
    { preHandler: authenticate },
    authController.me
  )

  app.post(
    '/logout',
    { preHandler: authenticate },
    authController.logout
  )
}
