import type { FastifyInstance } from 'fastify'

import * as userRestController from '../controllers/userRestController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  UserQuerySchema,
  CreateUserBodySchema,
  UpdateUserBodySchema,
  UpdatePasswordBodySchema,
  type UserQuery,
  type CreateUserBody,
  type UpdateUserBody,
  type UpdatePasswordBody
} from '../schemas/userSchemas.js'

export async function userRestRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get<{ Querystring: UserQuery }>(
    '/',
    { schema: { querystring: UserQuerySchema } },
    userRestController.getAll
  )

  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    userRestController.getById
  )

  app.post<{ Body: CreateUserBody }>(
    '/',
    { schema: { body: CreateUserBodySchema } },
    userRestController.create
  )

  app.put<{ Params: IdParam; Body: UpdateUserBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateUserBodySchema
      }
    },
    userRestController.update
  )

  app.put<{ Params: IdParam; Body: UpdatePasswordBody }>(
    '/:id/password',
    {
      schema: {
        params: IdParamSchema,
        body: UpdatePasswordBodySchema
      }
    },
    userRestController.updatePassword
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    userRestController.remove
  )
}
