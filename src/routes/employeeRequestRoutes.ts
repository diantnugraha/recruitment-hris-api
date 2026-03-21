import type { FastifyInstance } from 'fastify'

import * as employeeRequestController from '../controllers/employeeRequestController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { enrichUserContext } from '../middlewares/enrichUserContext.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  EmployeeRequestQuerySchema,
  CreateEmployeeRequestBodySchema,
  UpdateEmployeeRequestBodySchema,
  UpdateEmployeeRequestStatusBodySchema,
  AddCommentBodySchema,
  type EmployeeRequestQuery,
  type CreateEmployeeRequestBody,
  type UpdateEmployeeRequestBody,
  type UpdateEmployeeRequestStatusBody,
  type AddCommentBody
} from '../schemas/employeeRequestSchemas.js'

export async function employeeRequestRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', enrichUserContext)

  // Get stats/summary
  app.get(
    '/stats',
    employeeRequestController.getStats
  )

  // List employee requests with filters and pagination
  app.get<{ Querystring: EmployeeRequestQuery }>(
    '/',
    { schema: { querystring: EmployeeRequestQuerySchema } },
    employeeRequestController.getAll
  )

  // Get employee request by ID
  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    employeeRequestController.getById
  )

  // Create new employee request
  app.post<{ Body: CreateEmployeeRequestBody }>(
    '/',
    { schema: { body: CreateEmployeeRequestBodySchema } },
    employeeRequestController.create
  )

  // Update employee request
  app.put<{ Params: IdParam; Body: UpdateEmployeeRequestBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateEmployeeRequestBodySchema
      }
    },
    employeeRequestController.update
  )

  // Update employee request status (workflow action)
  app.put<{ Params: IdParam; Body: UpdateEmployeeRequestStatusBody }>(
    '/:id/status',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateEmployeeRequestStatusBodySchema
      }
    },
    employeeRequestController.updateStatus
  )

  // Add comment to employee request
  app.post<{ Params: IdParam; Body: AddCommentBody }>(
    '/:id/comments',
    {
      schema: {
        params: IdParamSchema,
        body: AddCommentBodySchema
      }
    },
    employeeRequestController.addComment
  )

  // Delete employee request (only draft)
  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    employeeRequestController.remove
  )

  // Start recruitment from approved request
  app.post<{ Params: IdParam }>(
    '/:id/start-recruitment',
    { schema: { params: IdParamSchema } },
    employeeRequestController.startRecruitment
  )

  // Generate PDF for employee request
  app.get<{ Params: IdParam }>(
    '/:id/pdf',
    { schema: { params: IdParamSchema } },
    employeeRequestController.generatePdf
  )
}
