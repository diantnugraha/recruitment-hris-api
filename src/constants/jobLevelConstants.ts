export const JOB_LEVEL_CATEGORY = {
  FUNCTIONAL: 'Functional',
  STRUCTURAL: 'Structural'
} as const

export type JobLevelCategory = typeof JOB_LEVEL_CATEGORY[keyof typeof JOB_LEVEL_CATEGORY]

/**
 * Job Level Codes for structural positions
 * Used for auto-filling:
 * - Division.head_of_division_id
 * - Department.manager_id
 *
 * Note: These codes must match the `code` field in job_levels table
 */
export const JOB_LEVEL_CODES = {
  // Division head positions (fills Division.head_of_division_id)
  PRESIDENT_DIRECTOR: 'PRESIDENT_DIRECTOR',
  HEAD_OF_DIVISION: 'HEAD_OF_DIVISION',
  // Department manager positions (fills Department.manager_id)
  MANAGER: 'MANAGER'
} as const

export type JobLevelCode = typeof JOB_LEVEL_CODES[keyof typeof JOB_LEVEL_CODES]

/**
 * Codes that trigger Division.head_of_division_id update
 * Add new codes here if they should also fill head_of_division_id
 */
const DIVISION_HEAD_CODES: string[] = [
  JOB_LEVEL_CODES.PRESIDENT_DIRECTOR,
  JOB_LEVEL_CODES.HEAD_OF_DIVISION
]

/**
 * Codes that trigger Department.manager_id update
 * Add new codes here if they should also fill manager_id
 */
const DEPARTMENT_MANAGER_CODES: string[] = [
  JOB_LEVEL_CODES.MANAGER
]

/**
 * Check if Job Level requires updating Division.head_of_division_id
 */
export function isHeadOfDivision(jobLevelCode: string | null): boolean {
  if (!jobLevelCode) return false
  return DIVISION_HEAD_CODES.includes(jobLevelCode)
}

/**
 * Check if Job Level requires updating Department.manager_id
 */
export function isManager(jobLevelCode: string | null): boolean {
  if (!jobLevelCode) return false
  return DEPARTMENT_MANAGER_CODES.includes(jobLevelCode)
}

/**
 * Get structural action based on Job Level Code
 * Note: Deputy Head is optional and assigned manually via endpoint
 */
export type StructuralAction =
  | 'UPDATE_DIVISION_HEAD'
  | 'UPDATE_DEPARTMENT_MANAGER'
  | null

export function getStructuralAction(jobLevelCode: string | null): StructuralAction {
  if (isHeadOfDivision(jobLevelCode)) return 'UPDATE_DIVISION_HEAD'
  if (isManager(jobLevelCode)) return 'UPDATE_DEPARTMENT_MANAGER'
  return null
}
