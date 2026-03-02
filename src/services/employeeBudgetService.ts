import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js'
import * as employeeBudgetRepository from '../repositories/employeeBudgetRepository.js'
import * as departmentRepository from '../repositories/departmentRepository.js'
import { EMPLOYEE_BUDGET_ERRORS, CURRENT_YEAR } from '../constants/employeeBudgetConstants.js'
import type {
  EmployeeBudgetWithRelations,
  EmployeeBudgetFilters,
  PaginationParams
} from '../repositories/employeeBudgetRepository.js'

export type CreateEmployeeBudgetServiceData = {
  departmentId: number
  year: number
  technical: number
  admin: number
  document?: string
}

export type UpdateEmployeeBudgetServiceData = {
  departmentId?: number
  year?: number
  technical?: number
  admin?: number
  document?: string
}

export type PaginatedEmployeeBudgets = {
  items: EmployeeBudgetWithRelations[]
  total: number
}

export type BudgetSummaryItem = {
  departmentId: number
  departmentName: string
  departmentCode: string
  year: number
  previousYear: {
    technical: number
    admin: number
    total: number
  }
  currentYear: {
    technical: number
    admin: number
    total: number
  }
  growth: {
    technical: number
    admin: number
    total: number
  }
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function getAllEmployeeBudgets(
  filters: EmployeeBudgetFilters,
  pagination: PaginationParams
): Promise<PaginatedEmployeeBudgets> {
  const result = await employeeBudgetRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.getError())
  }

  return result.getValue()
}

export async function getEmployeeBudgetById(id: number): Promise<EmployeeBudgetWithRelations> {
  const result = await employeeBudgetRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.getError())
  }

  const budget = result.getValue()
  if (!budget) {
    throw new NotFoundError(EMPLOYEE_BUDGET_ERRORS.NOT_FOUND)
  }

  return budget
}

export async function createEmployeeBudget(
  data: CreateEmployeeBudgetServiceData
): Promise<EmployeeBudgetWithRelations> {
  // Validate department exists
  const deptResult = await departmentRepository.findById(data.departmentId)
  if (deptResult.isFailure()) {
    throw new Error(deptResult.getError())
  }
  if (!deptResult.getValue()) {
    throw new ValidationError(EMPLOYEE_BUDGET_ERRORS.DEPARTMENT_NOT_FOUND)
  }

  // Check for duplicate department + year
  const existsResult = await employeeBudgetRepository.existsForDepartmentYear(
    data.departmentId,
    data.year
  )
  if (existsResult.isFailure()) {
    throw new Error(existsResult.getError())
  }
  if (existsResult.getValue()) {
    throw new ConflictError(EMPLOYEE_BUDGET_ERRORS.DUPLICATE_YEAR)
  }

  const result = await employeeBudgetRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.getError())
  }

  return result.getValue()
}

export async function updateEmployeeBudget(
  id: number,
  data: UpdateEmployeeBudgetServiceData
): Promise<EmployeeBudgetWithRelations> {
  // Check if budget exists
  const existingResult = await employeeBudgetRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.getError())
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError(EMPLOYEE_BUDGET_ERRORS.NOT_FOUND)
  }

  // If changing department, validate it exists
  if (data.departmentId !== undefined && data.departmentId !== existing.departmentId) {
    const deptResult = await departmentRepository.findById(data.departmentId)
    if (deptResult.isFailure()) {
      throw new Error(deptResult.getError())
    }
    if (!deptResult.getValue()) {
      throw new ValidationError(EMPLOYEE_BUDGET_ERRORS.DEPARTMENT_NOT_FOUND)
    }
  }

  // Check for duplicate department + year (if either is changing)
  const newDepartmentId = data.departmentId ?? existing.departmentId
  const newYear = data.year ?? existing.year

  if (newDepartmentId !== existing.departmentId || newYear !== existing.year) {
    const existsResult = await employeeBudgetRepository.existsForDepartmentYearExcept(
      newDepartmentId,
      newYear,
      id
    )
    if (existsResult.isFailure()) {
      throw new Error(existsResult.getError())
    }
    if (existsResult.getValue()) {
      throw new ConflictError(EMPLOYEE_BUDGET_ERRORS.DUPLICATE_YEAR)
    }
  }

  const result = await employeeBudgetRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.getError())
  }

  return result.getValue()
}

export async function deleteEmployeeBudget(id: number): Promise<void> {
  const existingResult = await employeeBudgetRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.getError())
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError(EMPLOYEE_BUDGET_ERRORS.NOT_FOUND)
  }

  const result = await employeeBudgetRepository.remove(id)

  if (result.isFailure()) {
    throw new Error(result.getError())
  }
}

export async function getBudgetSummary(year?: number): Promise<BudgetSummaryItem[]> {
  const targetYear = year ?? CURRENT_YEAR
  const years = [targetYear, targetYear - 1]

  const result = await employeeBudgetRepository.findByYears(years)

  if (result.isFailure()) {
    throw new Error(result.getError())
  }

  const budgets = result.getValue()

  // Group by department
  const departmentMap = new Map<number, {
    department: { id: number; name: string; code: string }
    currentYear?: EmployeeBudgetWithRelations
    previousYear?: EmployeeBudgetWithRelations
  }>()

  for (const budget of budgets) {
    if (!departmentMap.has(budget.departmentId)) {
      departmentMap.set(budget.departmentId, {
        department: budget.department
      })
    }

    const entry = departmentMap.get(budget.departmentId)!

    if (budget.year === targetYear) {
      entry.currentYear = budget
    } else if (budget.year === targetYear - 1) {
      entry.previousYear = budget
    }
  }

  // Build summary
  const summary: BudgetSummaryItem[] = []

  for (const [departmentId, data] of departmentMap) {
    const prevTechnical = data.previousYear?.technical ?? 0
    const prevAdmin = data.previousYear?.admin ?? 0
    const prevTotal = prevTechnical + prevAdmin

    const currTechnical = data.currentYear?.technical ?? 0
    const currAdmin = data.currentYear?.admin ?? 0
    const currTotal = currTechnical + currAdmin

    summary.push({
      departmentId,
      departmentName: data.department.name,
      departmentCode: data.department.code,
      year: targetYear,
      previousYear: {
        technical: prevTechnical,
        admin: prevAdmin,
        total: prevTotal
      },
      currentYear: {
        technical: currTechnical,
        admin: currAdmin,
        total: currTotal
      },
      growth: {
        technical: calculateGrowth(currTechnical, prevTechnical),
        admin: calculateGrowth(currAdmin, prevAdmin),
        total: calculateGrowth(currTotal, prevTotal)
      }
    })
  }

  // Sort by department name
  summary.sort((a, b) => a.departmentName.localeCompare(b.departmentName))

  return summary
}
