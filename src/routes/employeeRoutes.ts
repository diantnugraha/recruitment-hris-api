import type { FastifyInstance } from 'fastify'

import * as employeeController from '../controllers/employeeController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { requireHrRole } from '../middlewares/roleMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  EmployeeQuerySchema,
  CreateEmployeeBodySchema,
  UpdateEmployeeBodySchema,
  CheckStructuralPositionQuerySchema,
  type EmployeeQuery,
  type CreateEmployeeBody,
  type UpdateEmployeeBody,
  type CheckStructuralPositionQuery
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
    { preHandler: requireHrRole, schema: { body: CreateEmployeeBodySchema } },
    employeeController.create
  )

  app.put<{ Params: IdParam; Body: UpdateEmployeeBody }>(
    '/:id',
    {
      preHandler: requireHrRole,
      schema: {
        params: IdParamSchema,
        body: UpdateEmployeeBodySchema
      }
    },
    employeeController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { preHandler: requireHrRole, schema: { params: IdParamSchema } },
    employeeController.remove
  )

  // Check if structural position is occupied (for confirmation dialog)
  app.get<{ Querystring: CheckStructuralPositionQuery }>(
    '/check-structural-position',
    { schema: { querystring: CheckStructuralPositionQuerySchema } },
    employeeController.checkStructuralPosition
  )
}
