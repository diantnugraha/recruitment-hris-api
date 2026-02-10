import type { FastifyInstance } from 'fastify'

import * as obsController from '../controllers/obsController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  ObsQuerySchema,
  CreateObsBodySchema,
  UpdateObsBodySchema,
  type ObsQuery,
  type CreateObsBody,
  type UpdateObsBody
} from '../schemas/obsSchemas.js'

export async function obsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get<{ Querystring: ObsQuery }>(
    '/',
    { schema: { querystring: ObsQuerySchema } },
    obsController.getAll
  )

  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    obsController.getById
  )

  app.post<{ Body: CreateObsBody }>(
    '/',
    { schema: { body: CreateObsBodySchema } },
    obsController.create
  )

  app.put<{ Params: IdParam; Body: UpdateObsBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateObsBodySchema
      }
    },
    obsController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    obsController.remove
  )
}
