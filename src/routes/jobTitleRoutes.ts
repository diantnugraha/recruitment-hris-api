import type { FastifyInstance } from 'fastify'

import * as jobTitleController from '../controllers/jobTitleController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  JobTitleQuerySchema,
  CreateJobTitleBodySchema,
  UpdateJobTitleBodySchema,
  type JobTitleQuery,
  type CreateJobTitleBody,
  type UpdateJobTitleBody
} from '../schemas/jobTitleSchemas.js'

export async function jobTitleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get<{ Querystring: JobTitleQuery }>(
    '/',
    { schema: { querystring: JobTitleQuerySchema } },
    jobTitleController.getAll
  )

  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    jobTitleController.getById
  )

  app.post<{ Body: CreateJobTitleBody }>(
    '/',
    { schema: { body: CreateJobTitleBodySchema } },
    jobTitleController.create
  )

  app.put<{ Params: IdParam; Body: UpdateJobTitleBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateJobTitleBodySchema
      }
    },
    jobTitleController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    jobTitleController.remove
  )
}
