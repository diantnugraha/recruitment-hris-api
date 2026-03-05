// Employee Request Status - Workflow states
export const EMPLOYEE_REQUEST_STATUS = {
  DRAFT: 'draft',
  CREATED: 'created',           // Waiting for HOD Review
  HOD_REVIEWED: 'hod_reviewed', // HOD Reviewed, waiting for HR Review
  REVIEWED: 'reviewed',         // HR Reviewed, waiting for Management Approval
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISE: 'revise',
  IN_RECRUITMENT: 'in_recruitment',
  COMPLETED: 'completed',
} as const

export type EmployeeRequestStatus = typeof EMPLOYEE_REQUEST_STATUS[keyof typeof EMPLOYEE_REQUEST_STATUS]

// Employment Type
export const EMPLOYMENT_TYPE = {
  PERMANENT: 'permanent',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  OUTSOURCE: 'outsource',
} as const

export type EmploymentType = typeof EMPLOYMENT_TYPE[keyof typeof EMPLOYMENT_TYPE]

// Request Reason
export const REQUEST_REASON = {
  NEW_POSITION: 'new_position',
  REPLACEMENT: 'replacement',
  EXPANSION: 'expansion',
  PROJECT: 'project',
} as const

export type RequestReason = typeof REQUEST_REASON[keyof typeof REQUEST_REASON]

// Education Level
export const EDUCATION_LEVEL = {
  SMA: 'sma',
  D3: 'd3',
  S1: 's1',
  S2: 's2',
  S3: 's3',
} as const

export type EducationLevel = typeof EDUCATION_LEVEL[keyof typeof EDUCATION_LEVEL]

// Gender Preference
export const GENDER_PREFERENCE = {
  MALE: 'male',
  FEMALE: 'female',
  ANY: 'any',
} as const

export type GenderPreference = typeof GENDER_PREFERENCE[keyof typeof GENDER_PREFERENCE]

// Comment Action Types
export const COMMENT_ACTION = {
  CREATED: 'created',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISED: 'revised',
  COMMENT: 'comment',
} as const

export type CommentAction = typeof COMMENT_ACTION[keyof typeof COMMENT_ACTION]

// Workflow transitions - who can do what
export const WORKFLOW_TRANSITIONS: Record<EmployeeRequestStatus, {
  nextStatuses: EmployeeRequestStatus[]
  allowedRoles: string[]
}> = {
  draft: {
    nextStatuses: ['created'],
    allowedRoles: ['manager', 'head', 'admin'],
  },
  created: {
    // HOD Review: HOD can approve to hod_reviewed or request revise
    nextStatuses: ['hod_reviewed', 'revise'],
    allowedRoles: ['hod', 'head', 'admin'],
  },
  hod_reviewed: {
    // HR Review: HR can approve to reviewed or request revise
    nextStatuses: ['reviewed', 'revise'],
    allowedRoles: ['hr', 'admin'],
  },
  reviewed: {
    // Management Approval: Management can approve or reject
    nextStatuses: ['approved', 'rejected'],
    allowedRoles: ['management', 'admin'],
  },
  approved: {
    nextStatuses: ['in_recruitment'],
    allowedRoles: ['hr', 'admin'],
  },
  rejected: {
    nextStatuses: [],
    allowedRoles: [],
  },
  revise: {
    nextStatuses: ['created'],
    allowedRoles: ['manager', 'head', 'admin'],
  },
  in_recruitment: {
    nextStatuses: ['completed'],
    allowedRoles: ['hr', 'admin'],
  },
  completed: {
    nextStatuses: [],
    allowedRoles: [],
  },
}
