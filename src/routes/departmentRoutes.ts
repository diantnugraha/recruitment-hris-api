import type { FastifyInstance } from 'fastify'

import * as departmentController from '../controllers/departmentController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { requireHrRole } from '../middlewares/roleMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  DepartmentQuerySchema,
  CreateDepartmentBodySchema,
  UpdateDepartmentBodySchema,
  AssignManagerBodySchema,
  type DepartmentQuery,
  type CreateDepartmentBody,
  type UpdateDepartmentBody,
  type AssignManagerBody
} from '../schemas/departmentSchemas.js'

export async function departmentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get<{ Querystring: DepartmentQuery }>(
    '/',
    { schema: { querystring: DepartmentQuerySchema } },
    departmentController.getAll
  )

  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    departmentController.getById
  )

  app.post<{ Body: CreateDepartmentBody }>(
    '/',
    { preHandler: requireHrRole, schema: { body: CreateDepartmentBodySchema } },
    departmentController.create
  )

  app.put<{ Params: IdParam; Body: UpdateDepartmentBody }>(
    '/:id',
    {
      preHandler: requireHrRole,
      schema: {
        params: IdParamSchema,
        body: UpdateDepartmentBodySchema
      }
    },
    departmentController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { preHandler: requireHrRole, schema: { params: IdParamSchema } },
    departmentController.remove
  )

  // Assign Manager
  app.put<{ Params: IdParam; Body: AssignManagerBody }>(
    '/:id/manager',
    {
      preHandler: requireHrRole,
      schema: {
        params: IdParamSchema,
        body: AssignManagerBodySchema
      }
    },
    departmentController.assignManager
  )

  // Remove Manager
  app.delete<{ Params: IdParam }>(
    '/:id/manager',
    { preHandler: requireHrRole, schema: { params: IdParamSchema } },
    departmentController.removeManager
  )
}
