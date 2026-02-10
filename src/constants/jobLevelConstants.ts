export const JOB_LEVEL_CATEGORY = {
  FUNCTIONAL: 'Functional',
  STRUCTURAL: 'Structural'
} as const

export type JobLevelCategory = typeof JOB_LEVEL_CATEGORY[keyof typeof JOB_LEVEL_CATEGORY]
