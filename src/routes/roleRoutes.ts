import type { FastifyInstance } from 'fastify'

import * as roleController from '../controllers/roleController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { requireHrRole } from '../middlewares/roleMiddleware.js'
import {
  RoleQuerySchema,
  RoleIdParamSchema,
  CreateRoleBodySchema,
  UpdateRoleBodySchema,
  type RoleQuery,
  type RoleIdParam,
  type CreateRoleBody,
  type UpdateRoleBody
} from '../schemas/roleSchemas.js'

export async function roleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get<{ Querystring: RoleQuery }>(
    '/',
    { schema: { querystring: RoleQuerySchema } },
    roleController.getAll
  )

  app.get<{ Params: RoleIdParam }>(
    '/:id',
    { schema: { params: RoleIdParamSchema } },
    roleController.getById
  )

  app.post<{ Body: CreateRoleBody }>(
    '/',
    {
      schema: { body: CreateRoleBodySchema },
      preHandler: requireHrRole
    },
    roleController.create
  )

  app.put<{ Params: RoleIdParam; Body: UpdateRoleBody }>(
    '/:id',
    {
      schema: {
        params: RoleIdParamSchema,
        body: UpdateRoleBodySchema
      },
      preHandler: requireHrRole
    },
    roleController.update
  )

  app.delete<{ Params: RoleIdParam }>(
    '/:id',
    {
      schema: { params: RoleIdParamSchema },
      preHandler: requireHrRole
    },
    roleController.remove
  )
}
