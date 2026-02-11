import { Type, type Static } from '@sinclair/typebox'

import { JOB_TITLE_TYPE } from '../constants/jobTitleConstants.js'
import { PaginationQuerySchema } from './common.js'

export const JobTitleTypeSchema = Type.Union([
  Type.Literal(JOB_TITLE_TYPE.ADMINISTRATION),
  Type.Literal(JOB_TITLE_TYPE.TECHNICAL)
])

export const JobTitleQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  purpose: Type.Optional(Type.String()),
  requirement: Type.Optional(Type.String()),
  job_level_id: Type.Optional(Type.Integer({ minimum: 1 })),
  direct_report_id: Type.Optional(Type.Integer({ minimum: 1 })),
  department_id: Type.Optional(Type.String()),
  order_gte: Type.Optional(Type.Integer({ minimum: 0 }))
})

export type JobTitleQuery = Static<typeof JobTitleQuerySchema>

export const CreateJobTitleBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  job_level_id: Type.Integer({ minimum: 1 }),
  division_id: Type.Optional(Type.Integer({ minimum: 1 })),
  direct_report_id: Type.Optional(Type.Integer({ minimum: 1 })),
  type: Type.Optional(JobTitleTypeSchema),
  description: Type.Optional(Type.String()),
  purpose: Type.Optional(Type.String()),
  requirement: Type.Optional(Type.String()),
  department_sync: Type.Optional(Type.Array(Type.Integer({ minimum: 1 }))),
  department_attach: Type.Optional(Type.Array(Type.Integer({ minimum: 1 })))
})

export type CreateJobTitleBody = Static<typeof CreateJobTitleBodySchema>

export const UpdateJobTitleBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  job_level_id: Type.Optional(Type.Integer({ minimum: 1 })),
  division_id: Type.Optional(Type.Integer({ minimum: 1 })),
  direct_report_id: Type.Optional(Type.Integer({ minimum: 1 })),
  type: Type.Optional(JobTitleTypeSchema),
  description: Type.Optional(Type.String()),
  purpose: Type.Optional(Type.String()),
  requirement: Type.Optional(Type.String()),
  department_attach: Type.Optional(Type.Array(Type.Integer({ minimum: 1 }))),
  department_detach: Type.Optional(Type.Array(Type.Integer({ minimum: 1 }))),
  department_sync: Type.Optional(Type.Array(Type.Integer({ minimum: 1 })))
})

export type UpdateJobTitleBody = Static<typeof UpdateJobTitleBodySchema>
