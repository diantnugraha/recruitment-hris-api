import { Type, type Static } from '@sinclair/typebox'

// ==================== EDUCATIONAL BACKGROUND ====================

export const EducationalBackgroundItemSchema = Type.Object({
  school_university: Type.String({ maxLength: 50 }),
  city: Type.String({ maxLength: 50 }),
  degree: Type.String({ maxLength: 30 }),
  major: Type.String({ maxLength: 30 }),
  year_graduate: Type.Number({ minimum: 1900, maximum: 2100 })
})

export const EducationalBackgroundInputSchema = Type.Object({
  items: Type.Array(EducationalBackgroundItemSchema)
})

export const EducationalBackgroundResponseSchema = Type.Object({
  id: Type.Number(),
  candidate_id: Type.Number(),
  school_university: Type.String(),
  city: Type.String(),
  degree: Type.String(),
  major: Type.String(),
  year_graduate: Type.Number(),
  created_at: Type.Union([Type.String(), Type.Null()]),
  updated_at: Type.Union([Type.String(), Type.Null()])
})

export type EducationalBackgroundInput = Static<typeof EducationalBackgroundInputSchema>

// ==================== WORK EXPERIENCE ====================

export const WorkExperienceItemSchema = Type.Object({
  company: Type.String({ maxLength: 50 }),
  city: Type.String({ maxLength: 50 }),
  job_title: Type.String({ maxLength: 30 }),
  period: Type.String({ maxLength: 30 }),
  length_of_working: Type.String({ maxLength: 30 })
})

export const WorkExperienceInputSchema = Type.Object({
  items: Type.Array(WorkExperienceItemSchema)
})

export const WorkExperienceResponseSchema = Type.Object({
  id: Type.Number(),
  candidate_id: Type.Number(),
  company: Type.String(),
  city: Type.String(),
  job_title: Type.String(),
  period: Type.String(),
  length_of_working: Type.String(),
  created_at: Type.Union([Type.String(), Type.Null()]),
  updated_at: Type.Union([Type.String(), Type.Null()])
})

export type WorkExperienceInput = Static<typeof WorkExperienceInputSchema>

// ==================== FAMILY MEMBERS ====================

export const FamilyMemberItemSchema = Type.Object({
  name: Type.String({ maxLength: 50 }),
  relation: Type.String({ maxLength: 50 }),
  age: Type.Number({ minimum: 0, maximum: 150 }),
  education: Type.String({ maxLength: 30 }),
  work: Type.String({ maxLength: 30 })
})

export const FamilyMemberInputSchema = Type.Object({
  items: Type.Array(FamilyMemberItemSchema)
})

export const FamilyMemberResponseSchema = Type.Object({
  id: Type.Number(),
  candidate_id: Type.Number(),
  name: Type.String(),
  relation: Type.String(),
  age: Type.Number(),
  education: Type.String(),
  work: Type.String(),
  created_at: Type.Union([Type.String(), Type.Null()]),
  updated_at: Type.Union([Type.String(), Type.Null()])
})

export type FamilyMemberInput = Static<typeof FamilyMemberInputSchema>

// ==================== COURSE/TRAINING ====================

export const CourseTrainingItemSchema = Type.Object({
  course_topic: Type.String({ maxLength: 100 }),
  provider: Type.String({ maxLength: 50 }),
  year: Type.Number({ minimum: 1900, maximum: 2100 }),
  city: Type.String({ maxLength: 30 }),
  certificate: Type.String({ maxLength: 100 })
})

export const CourseTrainingInputSchema = Type.Object({
  items: Type.Array(CourseTrainingItemSchema)
})

export const CourseTrainingResponseSchema = Type.Object({
  id: Type.Number(),
  candidate_id: Type.Number(),
  course_topic: Type.String(),
  provider: Type.String(),
  year: Type.Number(),
  city: Type.String(),
  certificate: Type.String(),
  created_at: Type.Union([Type.String(), Type.Null()]),
  updated_at: Type.Union([Type.String(), Type.Null()])
})

export type CourseTrainingInput = Static<typeof CourseTrainingInputSchema>

// ==================== ASSESSMENT ====================

export const AssessmentInputSchema = Type.Object({
  reason_leaving_last_job: Type.Optional(Type.String()),
  last_job_description: Type.Optional(Type.String()),
  reason_applying: Type.Optional(Type.String()),
  relevant_skills: Type.Optional(Type.String()),
  last_salary: Type.Optional(Type.String({ maxLength: 30 })),
  expected_salary: Type.Optional(Type.String({ maxLength: 30 })),
  active_language: Type.Optional(Type.String({ maxLength: 30 })),
  willing_to_transfer: Type.Optional(Type.String({ maxLength: 30 })),
  willing_to_double_work: Type.Optional(Type.String({ maxLength: 30 })),
  known_employees: Type.Optional(Type.String({ maxLength: 30 })),
  ready_to_work: Type.Optional(Type.String({ maxLength: 30 })),
  employee_relationship: Type.Optional(Type.String({ maxLength: 30 })),
  reference_contact_name: Type.Optional(Type.String({ maxLength: 30 })),
  reference_contact_phone: Type.Optional(Type.String({ maxLength: 30 }))
})

export const AssessmentResponseSchema = Type.Object({
  id: Type.Number(),
  candidate_id: Type.Number(),
  reason_leaving_last_job: Type.String(),
  last_job_description: Type.String(),
  reason_applying: Type.String(),
  relevant_skills: Type.String(),
  last_salary: Type.String(),
  expected_salary: Type.String(),
  active_language: Type.String(),
  willing_to_transfer: Type.String(),
  willing_to_double_work: Type.String(),
  known_employees: Type.String(),
  ready_to_work: Type.String(),
  employee_relationship: Type.String(),
  reference_contact_name: Type.String(),
  reference_contact_phone: Type.String(),
  created_at: Type.Union([Type.String(), Type.Null()]),
  updated_at: Type.Union([Type.String(), Type.Null()])
})

export type AssessmentInput = Static<typeof AssessmentInputSchema>
