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

// Notification Types for Employee Request workflow
export const ER_NOTIFICATION_TYPE = {
  SUBMITTED: 'employee_request_submitted',
  HOD_APPROVED: 'employee_request_hod_approved',
  HR_APPROVED: 'employee_request_hr_approved',
  APPROVED: 'employee_request_approved',
  REVISED: 'employee_request_revised',
  REJECTED: 'employee_request_rejected',
} as const

export type ErNotificationType = typeof ER_NOTIFICATION_TYPE[keyof typeof ER_NOTIFICATION_TYPE]

// Notification action labels and colors for email templates
export const ER_NOTIFICATION_CONFIG: Record<ErNotificationType, { label: string; color: string }> = {
  [ER_NOTIFICATION_TYPE.SUBMITTED]: { label: 'Submitted for Review', color: '#0032A0' },
  [ER_NOTIFICATION_TYPE.HOD_APPROVED]: { label: 'Approved by Head of Division', color: '#0032A0' },
  [ER_NOTIFICATION_TYPE.HR_APPROVED]: { label: 'Reviewed by HR', color: '#0032A0' },
  [ER_NOTIFICATION_TYPE.APPROVED]: { label: 'Approved by Management', color: '#16a34a' },
  [ER_NOTIFICATION_TYPE.REVISED]: { label: 'Revision Requested', color: '#f59e0b' },
  [ER_NOTIFICATION_TYPE.REJECTED]: { label: 'Rejected', color: '#dc2626' },
}

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
    allowedRoles: ['manager', 'admin'],
  },
  created: {
    nextStatuses: ['hod_reviewed', 'revise'],
    allowedRoles: ['hod', 'admin'],
  },
  hod_reviewed: {
    nextStatuses: ['reviewed', 'revise'],
    allowedRoles: ['hr', 'admin'],
  },
  reviewed: {
    nextStatuses: ['approved', 'rejected', 'revise'],
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
    allowedRoles: ['manager', 'admin'],
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
