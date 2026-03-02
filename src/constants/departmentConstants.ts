import { departments_category } from '@prisma/client'

export const DEPARTMENT_CATEGORY = {
  NON_PROFIT_CENTER: 'Non Profit Center',
  PROFIT_CENTER: 'Profit Center'
} as const

export type DepartmentCategory = typeof DEPARTMENT_CATEGORY[keyof typeof DEPARTMENT_CATEGORY]

export const DEPARTMENT_CATEGORY_VALUES = Object.values(DEPARTMENT_CATEGORY) as [string, ...string[]]

// Map display string to Prisma enum value
export const CATEGORY_TO_PRISMA: Record<DepartmentCategory, departments_category> = {
  'Non Profit Center': 'Non_Profit_Center',
  'Profit Center': 'Profit_Center'
}

export function toPrismaCategory(category: DepartmentCategory): departments_category {
  return CATEGORY_TO_PRISMA[category]
}
