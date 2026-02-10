import type { FastifyInstance } from 'fastify'

import * as departmentController from '../controllers/departmentController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  DepartmentQuerySchema,
  CreateDepartmentBodySchema,
  UpdateDepartmentBodySchema,
  type DepartmentQuery,
  type CreateDepartmentBody,
  type UpdateDepartmentBody
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
    { schema: { body: CreateDepartmentBodySchema } },
    departmentController.create
  )

  app.put<{ Params: IdParam; Body: UpdateDepartmentBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateDepartmentBodySchema
      }
    },
    departmentController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    departmentController.remove
  )
}
