import type { FastifyInstance } from 'fastify'

import * as divisionController from '../controllers/divisionController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
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
    { schema: { body: CreateDivisionBodySchema } },
    divisionController.create
  )

  app.put<{ Params: IdParam; Body: UpdateDivisionBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateDivisionBodySchema
      }
    },
    divisionController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    divisionController.remove
  )

  // Assign Head of Division
  app.put<{ Params: IdParam; Body: AssignHeadBody }>(
    '/:id/head',
    {
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
    { schema: { params: IdParamSchema } },
    divisionController.removeHead
  )

  // Assign Deputy Head
  app.put<{ Params: IdParam; Body: AssignHeadBody }>(
    '/:id/deputy',
    {
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
    { schema: { params: IdParamSchema } },
    divisionController.removeDeputy
  )
}
