export const EMPLOYEE_BUDGET_ERRORS = {
  NOT_FOUND: 'Employee budget not found',
  DEPARTMENT_NOT_FOUND: 'Department not found',
  DUPLICATE_YEAR: 'Budget for this department and year already exists',
  INVALID_YEAR: 'Invalid budget year',
  INVALID_VALUES: 'Technical and admin values must be non-negative'
} as const

export const CURRENT_YEAR = new Date().getFullYear()

export const MIN_BUDGET_YEAR = 2000
export const MAX_BUDGET_YEAR = 2100
