import type { FastifyInstance } from 'fastify'

import * as employeeBudgetController from '../controllers/employeeBudgetController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  EmployeeBudgetQuerySchema,
  CreateEmployeeBudgetBodySchema,
  UpdateEmployeeBudgetBodySchema,
  SummaryQuerySchema,
  type EmployeeBudgetQuery,
  type CreateEmployeeBudgetBody,
  type UpdateEmployeeBudgetBody,
  type SummaryQuery
} from '../schemas/employeeBudgetSchemas.js'

export async function employeeBudgetRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // Get budget summary (must be before /:id to avoid conflict)
  app.get<{ Querystring: SummaryQuery }>(
    '/summary',
    { schema: { querystring: SummaryQuerySchema } },
    employeeBudgetController.getSummary
  )

  // Get all employee budgets
  app.get<{ Querystring: EmployeeBudgetQuery }>(
    '/',
    { schema: { querystring: EmployeeBudgetQuerySchema } },
    employeeBudgetController.getAll
  )

  // Get employee budget by ID
  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    employeeBudgetController.getById
  )

  // Create employee budget
  app.post<{ Body: CreateEmployeeBudgetBody }>(
    '/',
    { schema: { body: CreateEmployeeBudgetBodySchema } },
    employeeBudgetController.create
  )

  // Update employee budget
  app.put<{ Params: IdParam; Body: UpdateEmployeeBudgetBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateEmployeeBudgetBodySchema
      }
    },
    employeeBudgetController.update
  )

  // Delete employee budget
  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    employeeBudgetController.remove
  )
}
