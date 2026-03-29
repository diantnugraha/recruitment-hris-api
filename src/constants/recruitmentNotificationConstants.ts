export const RECRUITMENT_NOTIFICATION_TYPE = {
  BIODATA_SUBMITTED: 'recruitment_biodata_submitted',
  ASSESSOR_ASSIGNED: 'recruitment_assessor_assigned',
  INTERVIEW_USER_COMPLETED: 'recruitment_interview_user_completed',
  ONBOARDING_ACCEPTED: 'recruitment_onboarding_accepted',
} as const

export type RecruitmentNotificationType =
  typeof RECRUITMENT_NOTIFICATION_TYPE[keyof typeof RECRUITMENT_NOTIFICATION_TYPE]

export const RECRUITMENT_NOTIFICATION_CONFIG: Record<
  RecruitmentNotificationType,
  { label: string; color: string }
> = {
  [RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED]: {
    label: 'Biodata Submitted',
    color: '#0032A0',
  },
  [RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED]: {
    label: 'Assessor Assigned',
    color: '#0032A0',
  },
  [RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED]: {
    label: 'Interview User Completed',
    color: '#0032A0',
  },
  [RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED]: {
    label: 'Onboarding Accepted',
    color: '#16a34a',
  },
}
