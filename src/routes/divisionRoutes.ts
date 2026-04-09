import type { FastifyInstance } from 'fastify'

import * as divisionController from '../controllers/divisionController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { requireHrRole } from '../middlewares/roleMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  DivisionQuerySchema,
  CreateDivisionBodySchema,
  UpdateDivisionBodySchema,
  AssignHeadBodySchema,
  type DivisionQuery,
  type CreateDivisionBody,
  type UpdateDivisionBody,
  type AssignHeadBody
} from '../schemas/divisionSchemas.js'

export async function divisionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // Get all management divisions (BOD level)
  app.get('/management', divisionController.getManagement)

  app.get<{ Querystring: DivisionQuery }>(
    '/',
    { schema: { querystring: DivisionQuerySchema } },
    divisionController.getAll
  )

  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    divisionController.getById
  )

  app.post<{ Body: CreateDivisionBody }>(
    '/',
    { preHandler: requireHrRole, schema: { body: CreateDivisionBodySchema } },
    divisionController.create
  )

  app.put<{ Params: IdParam; Body: UpdateDivisionBody }>(
    '/:id',
    {
      preHandler: requireHrRole,
      schema: {
        params: IdParamSchema,
        body: UpdateDivisionBodySchema
      }
    },
    divisionController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { preHandler: requireHrRole, schema: { params: IdParamSchema } },
    divisionController.remove
  )

  // Assign Head of Division
  app.put<{ Params: IdParam; Body: AssignHeadBody }>(
    '/:id/head',
    {
      preHandler: requireHrRole,
      schema: {
        params: IdParamSchema,
        body: AssignHeadBodySchema
      }
    },
    divisionController.assignHead
  )

  // Remove Head of Division
  app.delete<{ Params: IdParam }>(
    '/:id/head',
    { preHandler: requireHrRole, schema: { params: IdParamSchema } },
    divisionController.removeHead
  )

  // Assign Deputy Head
  app.put<{ Params: IdParam; Body: AssignHeadBody }>(
    '/:id/deputy',
    {
      preHandler: requireHrRole,
      schema: {
        params: IdParamSchema,
        body: AssignHeadBodySchema
      }
    },
    divisionController.assignDeputy
  )

  // Remove Deputy Head
  app.delete<{ Params: IdParam }>(
    '/:id/deputy',
    { preHandler: requireHrRole, schema: { params: IdParamSchema } },
    divisionController.removeDeputy
  )
}
