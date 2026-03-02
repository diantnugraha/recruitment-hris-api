import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'
import {
  EMPLOYEE_REQUEST_STATUS,
  GENDER_PREFERENCE
} from '../constants/employeeRequestConstants.js'

// Status enum schemas
export const EmployeeRequestStatusSchema = Type.Union([
  Type.Literal(EMPLOYEE_REQUEST_STATUS.DRAFT),
  Type.Literal(EMPLOYEE_REQUEST_STATUS.CREATED),
  Type.Literal(EMPLOYEE_REQUEST_STATUS.REVIEWED),
  Type.Literal(EMPLOYEE_REQUEST_STATUS.APPROVED),
  Type.Literal(EMPLOYEE_REQUEST_STATUS.REJECTED),
  Type.Literal(EMPLOYEE_REQUEST_STATUS.REVISE),
  Type.Literal(EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT),
  Type.Literal(EMPLOYEE_REQUEST_STATUS.COMPLETED)
])

export const GenderPreferenceSchema = Type.Union([
  Type.Literal(GENDER_PREFERENCE.MALE),
  Type.Literal(GENDER_PREFERENCE.FEMALE),
  Type.Literal(GENDER_PREFERENCE.ANY)
])

// Query schema for listing employee requests
export const EmployeeRequestQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  status: Type.Optional(EmployeeRequestStatusSchema),
  job_title_id: Type.Optional(Type.Integer()),
  requested_by_id: Type.Optional(Type.Integer()),
  search: Type.Optional(Type.String())
})

export type EmployeeRequestQuery = Static<typeof EmployeeRequestQuerySchema>

// Create employee request body schema
// Based on actual DB schema: employee_request table
export const CreateEmployeeRequestBodySchema = Type.Object({
  job_title_id: Type.Integer(),
  reason: Type.String({ minLength: 1 }),
  purpose: Type.String({ minLength: 1 }),
  general_job_purpose: Type.Optional(Type.String()),
  job_description: Type.Optional(Type.String()),
  job_requirement: Type.Optional(Type.String()),
  education: Type.String({ minLength: 1, maxLength: 50 }),
  experience: Type.String({ minLength: 1, maxLength: 50 }),
  gender_preference: GenderPreferenceSchema,
  age_min: Type.Optional(Type.Integer({ minimum: 18, maximum: 100 })),
  age_max: Type.Optional(Type.Integer({ minimum: 18, maximum: 100 })),
  job_placement: Type.Optional(Type.String({ maxLength: 30 })),
  budget: Type.Optional(Type.String({ maxLength: 50 })),
  expected_onboard_date: Type.Optional(Type.String({ format: 'date' })),
  status: Type.Optional(Type.Union([
    Type.Literal(EMPLOYEE_REQUEST_STATUS.DRAFT),
    Type.Literal(EMPLOYEE_REQUEST_STATUS.CREATED)
  ]))
})

export type CreateEmployeeRequestBody = Static<typeof CreateEmployeeRequestBodySchema>

// Update employee request body schema
export const UpdateEmployeeRequestBodySchema = Type.Object({
  job_title_id: Type.Optional(Type.Integer()),
  reason: Type.Optional(Type.String({ minLength: 1 })),
  purpose: Type.Optional(Type.String({ minLength: 1 })),
  general_job_purpose: Type.Optional(Type.String()),
  job_description: Type.Optional(Type.String()),
  job_requirement: Type.Optional(Type.String()),
  education: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  experience: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  gender_preference: Type.Optional(GenderPreferenceSchema),
  age_min: Type.Optional(Type.Integer({ minimum: 18, maximum: 100 })),
  age_max: Type.Optional(Type.Integer({ minimum: 18, maximum: 100 })),
  job_placement: Type.Optional(Type.String({ maxLength: 30 })),
  budget: Type.Optional(Type.String({ maxLength: 50 })),
  expected_onboard_date: Type.Optional(Type.String({ format: 'date' }))
})

export type UpdateEmployeeRequestBody = Static<typeof UpdateEmployeeRequestBodySchema>

// Update status body schema
export const UpdateEmployeeRequestStatusBodySchema = Type.Object({
  status: EmployeeRequestStatusSchema,
  comment: Type.Optional(Type.String())
})

export type UpdateEmployeeRequestStatusBody = Static<typeof UpdateEmployeeRequestStatusBodySchema>

// Add comment body schema
export const AddCommentBodySchema = Type.Object({
  comment: Type.String({ minLength: 1 })
})

export type AddCommentBody = Static<typeof AddCommentBodySchema>
