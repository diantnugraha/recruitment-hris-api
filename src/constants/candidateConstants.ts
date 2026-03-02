export const CANDIDATE_STATUS = {
  APPLIED: 'applied',
  SCREENING: 'screening',
  INTERVIEW_1: 'interview_1',
  INTERVIEW_2: 'interview_2',
  MCU: 'mcu',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
} as const

export type CandidateStatus = typeof CANDIDATE_STATUS[keyof typeof CANDIDATE_STATUS]

export const CANDIDATE_SOURCE = {
  LINKEDIN: 'linkedin',
  JOB_PORTAL: 'job_portal',
  REFERRAL: 'referral',
  WEBSITE: 'website',
  OTHER: 'other'
} as const

export type CandidateSource = typeof CANDIDATE_SOURCE[keyof typeof CANDIDATE_SOURCE]

export const ASSESSMENT_TYPE = {
  INTERVIEW_1: 'interview_1',
  INTERVIEW_2: 'interview_2',
  MCU: 'mcu'
} as const

export type AssessmentType = typeof ASSESSMENT_TYPE[keyof typeof ASSESSMENT_TYPE]

export const ASSESSMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
} as const

export type AssessmentStatus = typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS]

export const ASSESSMENT_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  PENDING: 'pending'
} as const

export type AssessmentResult = typeof ASSESSMENT_RESULT[keyof typeof ASSESSMENT_RESULT]
