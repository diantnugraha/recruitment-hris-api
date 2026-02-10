import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'

export const JobLevelCategorySchema = Type.Union([
  Type.Literal('Functional'),
  Type.Literal('Structural')
])

export const JobLevelQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  category: Type.Optional(JobLevelCategorySchema),
  description: Type.Optional(Type.String()),
  can_create_job_title: Type.Optional(Type.Boolean()),
  can_create_kpi: Type.Optional(Type.Boolean()),
  order_gte: Type.Optional(Type.Integer({ minimum: 0 }))
})

export type JobLevelQuery = Static<typeof JobLevelQuerySchema>

export const CreateJobLevelBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  category: JobLevelCategorySchema,
  description: Type.Optional(Type.String()),
  can_create_job_title: Type.Optional(Type.Boolean()),
  can_create_kpi: Type.Optional(Type.Boolean()),
  order: Type.Optional(Type.Integer())
})

export type CreateJobLevelBody = Static<typeof CreateJobLevelBodySchema>

export const UpdateJobLevelBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  category: Type.Optional(JobLevelCategorySchema),
  description: Type.Optional(Type.String()),
  can_create_job_title: Type.Optional(Type.Boolean()),
  can_create_kpi: Type.Optional(Type.Boolean()),
  order: Type.Optional(Type.Integer())
})

export type UpdateJobLevelBody = Static<typeof UpdateJobLevelBodySchema>
