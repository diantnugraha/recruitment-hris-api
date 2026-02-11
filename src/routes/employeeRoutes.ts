import type { FastifyInstance } from 'fastify'

import * as employeeController from '../controllers/employeeController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  EmployeeQuerySchema,
  CreateEmployeeBodySchema,
  UpdateEmployeeBodySchema,
  type EmployeeQuery,
  type CreateEmployeeBody,
  type UpdateEmployeeBody
} from '../schemas/employeeSchemas.js'

export async function employeeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get<{ Querystring: EmployeeQuery }>(
    '/',
    { schema: { querystring: EmployeeQuerySchema } },
    employeeController.getAll
  )

  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    employeeController.getById
  )

  app.post<{ Body: CreateEmployeeBody }>(
    '/',
    { schema: { body: CreateEmployeeBodySchema } },
    employeeController.create
  )

  app.put<{ Params: IdParam; Body: UpdateEmployeeBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateEmployeeBodySchema
      }
    },
    employeeController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    employeeController.remove
  )
}
