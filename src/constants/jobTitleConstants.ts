export const JOB_TITLE_TYPE = {
  ADMINISTRATION: 'Administration',
  TECHNICAL: 'Technical'
} as const

export type JobTitleType = typeof JOB_TITLE_TYPE[keyof typeof JOB_TITLE_TYPE]
