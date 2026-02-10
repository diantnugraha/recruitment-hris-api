export const DEPARTMENT_CATEGORY = {
  NON_PROFIT_CENTER: 'Non Profit Center',
  PROFIT_CENTER: 'Profit Center'
} as const

export type DepartmentCategory = typeof DEPARTMENT_CATEGORY[keyof typeof DEPARTMENT_CATEGORY]

export const DEPARTMENT_CATEGORY_VALUES = Object.values(DEPARTMENT_CATEGORY) as [string, ...string[]]
