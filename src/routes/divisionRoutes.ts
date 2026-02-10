import type { FastifyInstance } from 'fastify'

import * as divisionController from '../controllers/divisionController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  DivisionQuerySchema,
  CreateDivisionBodySchema,
  UpdateDivisionBodySchema,
  type DivisionQuery,
  type CreateDivisionBody,
  type UpdateDivisionBody
} from '../schemas/divisionSchemas.js'

export async function divisionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

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
}
