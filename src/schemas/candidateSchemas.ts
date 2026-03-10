import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'
import {
  CANDIDATE_STATUS,
  CANDIDATE_SOURCE,
  ASSESSMENT_TYPE,
  ASSESSMENT_STATUS,
  ASSESSMENT_RESULT
} from '../constants/candidateConstants.js'

// Status enum schemas
export const CandidateStatusSchema = Type.Union([
  Type.Literal(CANDIDATE_STATUS.APPLIED),
  Type.Literal(CANDIDATE_STATUS.SCREENING),
  Type.Literal(CANDIDATE_STATUS.INTERVIEW_1),
  Type.Literal(CANDIDATE_STATUS.INTERVIEW_2),
  Type.Literal(CANDIDATE_STATUS.MCU),
  Type.Literal(CANDIDATE_STATUS.OFFER),
  Type.Literal(CANDIDATE_STATUS.HIRED),
  Type.Literal(CANDIDATE_STATUS.REJECTED),
  Type.Literal(CANDIDATE_STATUS.WITHDRAWN)
])

export const CandidateSourceSchema = Type.Union([
  Type.Literal(CANDIDATE_SOURCE.LINKEDIN),
  Type.Literal(CANDIDATE_SOURCE.JOB_PORTAL),
  Type.Literal(CANDIDATE_SOURCE.REFERRAL),
  Type.Literal(CANDIDATE_SOURCE.WEBSITE),
  Type.Literal(CANDIDATE_SOURCE.OTHER)
])

export const AssessmentTypeSchema = Type.Union([
  Type.Literal(ASSESSMENT_TYPE.INTERVIEW_1),
  Type.Literal(ASSESSMENT_TYPE.INTERVIEW_2),
  Type.Literal(ASSESSMENT_TYPE.MCU)
])

export const AssessmentStatusSchema = Type.Union([
  Type.Literal(ASSESSMENT_STATUS.SCHEDULED),
  Type.Literal(ASSESSMENT_STATUS.COMPLETED),
  Type.Literal(ASSESSMENT_STATUS.CANCELLED),
  Type.Literal(ASSESSMENT_STATUS.RESCHEDULED)
])

export const AssessmentResultSchema = Type.Union([
  Type.Literal(ASSESSMENT_RESULT.PASS),
  Type.Literal(ASSESSMENT_RESULT.FAIL),
  Type.Literal(ASSESSMENT_RESULT.PENDING)
])

// Query schema for listing candidates
export const CandidateQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  email: Type.Optional(Type.String()),
  status: Type.Optional(CandidateStatusSchema),
  source: Type.Optional(CandidateSourceSchema),
  job_title_id: Type.Optional(Type.Integer()),
  department_id: Type.Optional(Type.Integer())
})

export type CandidateQuery = Static<typeof CandidateQuerySchema>

// Create candidate body schema
export const CreateCandidateBodySchema = Type.Object({
  first_name: Type.String({ minLength: 1, maxLength: 100 }),
  last_name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email', maxLength: 100 }),
  phone: Type.Optional(Type.String({ maxLength: 50 })),
  source: Type.Optional(CandidateSourceSchema),
  current_company: Type.Optional(Type.String({ maxLength: 100 })),
  current_position: Type.Optional(Type.String({ maxLength: 100 })),
  expected_salary: Type.Optional(Type.Number()),
  notice_period: Type.Optional(Type.String({ maxLength: 50 })),
  resume_url: Type.Optional(Type.String({ maxLength: 255 })),
  linkedin_url: Type.Optional(Type.String({ maxLength: 255 })),
  portfolio_url: Type.Optional(Type.String({ maxLength: 255 })),
  notes: Type.Optional(Type.String()),
  job_title_id: Type.Optional(Type.Integer()),
  department_id: Type.Optional(Type.Integer())
})

export type CreateCandidateBody = Static<typeof CreateCandidateBodySchema>

// Update candidate body schema
export const UpdateCandidateBodySchema = Type.Object({
  first_name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  last_name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  email: Type.Optional(Type.String({ format: 'email', maxLength: 100 })),
  phone: Type.Optional(Type.String({ maxLength: 50 })),
  status: Type.Optional(CandidateStatusSchema),
  source: Type.Optional(CandidateSourceSchema),
  current_company: Type.Optional(Type.String({ maxLength: 100 })),
  current_position: Type.Optional(Type.String({ maxLength: 100 })),
  expected_salary: Type.Optional(Type.Number()),
  notice_period: Type.Optional(Type.String({ maxLength: 50 })),
  resume_url: Type.Optional(Type.String({ maxLength: 255 })),
  linkedin_url: Type.Optional(Type.String({ maxLength: 255 })),
  portfolio_url: Type.Optional(Type.String({ maxLength: 255 })),
  notes: Type.Optional(Type.String()),
  job_title_id: Type.Optional(Type.Union([Type.Integer(), Type.Null()])),
  department_id: Type.Optional(Type.Union([Type.Integer(), Type.Null()]))
})

export type UpdateCandidateBody = Static<typeof UpdateCandidateBodySchema>

// Update status only schema
export const UpdateCandidateStatusBodySchema = Type.Object({
  status: CandidateStatusSchema
})

export type UpdateCandidateStatusBody = Static<typeof UpdateCandidateStatusBodySchema>

// Assessment schemas
export const CreateAssessmentBodySchema = Type.Object({
  type: AssessmentTypeSchema,
  scheduled_date: Type.Optional(Type.String({ format: 'date-time' })),
  interviewer_id: Type.Optional(Type.Integer()),
  location: Type.Optional(Type.String({ maxLength: 100 })),
  notes: Type.Optional(Type.String())
})

export type CreateAssessmentBody = Static<typeof CreateAssessmentBodySchema>

export const UpdateAssessmentBodySchema = Type.Object({
  scheduled_date: Type.Optional(Type.String({ format: 'date-time' })),
  conducted_date: Type.Optional(Type.String({ format: 'date-time' })),
  interviewer_id: Type.Optional(Type.Integer()),
  location: Type.Optional(Type.String({ maxLength: 100 })),
  status: Type.Optional(AssessmentStatusSchema),
  result: Type.Optional(AssessmentResultSchema),
  feedback: Type.Optional(Type.String()),
  rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
  notes: Type.Optional(Type.String())
})

export type UpdateAssessmentBody = Static<typeof UpdateAssessmentBodySchema>

// Start assessment (interview scheduling) schema
export const InterviewTypeSchema = Type.Union([
  Type.Literal('online'),
  Type.Literal('onsite')
])

export const StartAssessmentBodySchema = Type.Object({
  interview_date: Type.String({ format: 'date-time' }),
  interview_type: InterviewTypeSchema
})

export type StartAssessmentBody = Static<typeof StartAssessmentBodySchema>
