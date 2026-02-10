import type { FastifyInstance } from 'fastify'

import * as jobLevelController from '../controllers/jobLevelController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'
import {
  JobLevelQuerySchema,
  CreateJobLevelBodySchema,
  UpdateJobLevelBodySchema,
  type JobLevelQuery,
  type CreateJobLevelBody,
  type UpdateJobLevelBody
} from '../schemas/jobLevelSchemas.js'

export async function jobLevelRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get<{ Querystring: JobLevelQuery }>(
    '/',
    { schema: { querystring: JobLevelQuerySchema } },
    jobLevelController.getAll
  )

  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    jobLevelController.getById
  )

  app.post<{ Body: CreateJobLevelBody }>(
    '/',
    { schema: { body: CreateJobLevelBodySchema } },
    jobLevelController.create
  )

  app.put<{ Params: IdParam; Body: UpdateJobLevelBody }>(
    '/:id',
    {
      schema: {
        params: IdParamSchema,
        body: UpdateJobLevelBodySchema
      }
    },
    jobLevelController.update
  )

  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    jobLevelController.remove
  )
}
