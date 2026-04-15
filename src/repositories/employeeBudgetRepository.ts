import { Prisma } from '@prisma/client'
import type { EmployeeBudget, Department, JobTitleType } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type EmployeeBudgetWithRelations = EmployeeBudget & {
  department: Pick<Department, 'id' | 'name' | 'code'>
}

export type EmployeeBudgetFilters = {
  departmentId?: number
  year?: number
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: EmployeeBudgetWithRelations[]
  total: number
}

export type CreateEmployeeBudgetData = {
  departmentId: number
  year: number
  technical: number
  admin: number
  document?: string | null
  documentName?: string | null
}

export type UpdateEmployeeBudgetData = {
  departmentId?: number
  year?: number
  technical?: number
  admin?: number
  document?: string | null
  documentName?: string | null
}

const employeeBudgetSelectFields = {
  id: true,
  departmentId: true,
  year: true,
  technical: true,
  admin: true,
  document: true,
  documentName: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true,
      code: true
    }
  }
} as const

export async function findAll(
  filters: EmployeeBudgetFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.EmployeeBudgetWhereInput = {
      ...(filters.departmentId && { departmentId: filters.departmentId }),
      ...(filters.year && { year: filters.year })
    }

    const [items, total] = await prisma.$transaction([
      prisma.employeeBudget.findMany({
        where,
        select: employeeBudgetSelectFields,
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.employeeBudget.count({ where })
    ])

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch employee budgets'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<EmployeeBudgetWithRelations | null>> {
  try {
    const budget = await prisma.employeeBudget.findUnique({
      where: { id },
      select: employeeBudgetSelectFields
    })
    return success(budget)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find employee budget by id'
    return failure(message)
  }
}

export async function findByDepartmentAndYear(
  departmentId: number,
  year: number
): Promise<RepositoryResult<EmployeeBudgetWithRelations | null>> {
  try {
    const budget = await prisma.employeeBudget.findFirst({
      where: { departmentId, year },
      select: employeeBudgetSelectFields
    })
    return success(budget)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find employee budget'
    return failure(message)
  }
}

export async function create(data: CreateEmployeeBudgetData): Promise<RepositoryResult<EmployeeBudgetWithRelations>> {
  try {
    const budget = await prisma.employeeBudget.create({
      data: {
        departmentId: data.departmentId,
        year: data.year,
        technical: data.technical,
        admin: data.admin,
        ...(data.document !== undefined && { document: data.document }),
        ...(data.documentName !== undefined && { documentName: data.documentName })
      },
      select: employeeBudgetSelectFields
    })
    return success(budget)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create employee budget'
    return failure(message)
  }
}

export async function update(
  id: number,
  data: UpdateEmployeeBudgetData
): Promise<RepositoryResult<EmployeeBudgetWithRelations>> {
  try {
    const budget = await prisma.employeeBudget.update({
      where: { id },
      data: {
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.technical !== undefined && { technical: data.technical }),
        ...(data.admin !== undefined && { admin: data.admin }),
        ...(data.document !== undefined && { document: data.document }),
        ...(data.documentName !== undefined && { documentName: data.documentName }),
        updatedAt: new Date()
      },
      select: employeeBudgetSelectFields
    })
    return success(budget)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update employee budget'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.employeeBudget.delete({
      where: { id }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete employee budget'
    return failure(message)
  }
}

export async function existsForDepartmentYear(
  departmentId: number,
  year: number
): Promise<RepositoryResult<boolean>> {
  try {
    const budget = await prisma.employeeBudget.findFirst({
      where: { departmentId, year },
      select: { id: true }
    })
    return success(budget !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check budget existence'
    return failure(message)
  }
}

export async function existsForDepartmentYearExcept(
  departmentId: number,
  year: number,
  exceptId: number
): Promise<RepositoryResult<boolean>> {
  try {
    const budget = await prisma.employeeBudget.findFirst({
      where: {
        departmentId,
        year,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(budget !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check budget existence'
    return failure(message)
  }
}

export async function findByYear(year: number): Promise<RepositoryResult<EmployeeBudgetWithRelations[]>> {
  try {
    const budgets = await prisma.employeeBudget.findMany({
      where: { year },
      select: employeeBudgetSelectFields,
      orderBy: { department: { name: 'asc' } }
    })
    return success(budgets)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch budgets by year'
    return failure(message)
  }
}

export async function findByYears(years: number[]): Promise<RepositoryResult<EmployeeBudgetWithRelations[]>> {
  try {
    const budgets = await prisma.employeeBudget.findMany({
      where: { year: { in: years } },
      select: employeeBudgetSelectFields,
      orderBy: [{ departmentId: 'asc' }, { year: 'desc' }]
    })
    return success(budgets)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch budgets by years'
    return failure(message)
  }
}

// Count active employees by department grouped by job title type (Technical/Administration)
export type EmployeeCountByCategory = {
  technical: number
  admin: number
}

// All possible employee_status values that indicate active employment (case-insensitive).
// The DB stores legacy values (Indonesian/English mixed), while the API transformer
// normalises them. This list must cover both legacy and normalised forms.
const ACTIVE_EMPLOYEE_STATUSES = [
  'probation', 'contract', 'permanent',
  'tetap', 'kontrak', 'pkwt', 'pkwtt',
  'active', 'aktif',
]

export async function countActiveEmployeesByDeptAndCategory(
  departmentId: number
): Promise<RepositoryResult<EmployeeCountByCategory>> {
  try {
    // Count employees grouped by job title type.
    // Department is filtered by e.department_id (direct FK).
    // Job title is matched by FK first, then by name as fallback for legacy data
    // where job_title_id is NULL but employee_title text is set.
    const results = await prisma.$queryRaw<{ type: JobTitleType | null; count: bigint }[]>`
      SELECT jt.type, COUNT(DISTINCT e.employee_id) as count
      FROM employee_list e
      INNER JOIN job_titles jt ON (
        e.job_title_id = jt.id
        OR (e.job_title_id IS NULL AND LOWER(TRIM(e.employee_title)) = LOWER(TRIM(jt.name)))
      )
      INNER JOIN department_job_title djt ON jt.id = djt.job_title_id AND djt.department_id = ${departmentId}
      WHERE e.department_id = ${departmentId}
        AND (e.employee_trash IS NULL OR e.employee_trash = 0)
        AND LOWER(TRIM(COALESCE(e.employee_status, ''))) IN (${Prisma.join(ACTIVE_EMPLOYEE_STATUSES)})
      GROUP BY jt.type
    `

    const counts: EmployeeCountByCategory = { technical: 0, admin: 0 }
    for (const row of results) {
      if (row.type === 'Technical') {
        counts.technical = Number(row.count)
      } else if (row.type === 'Administration') {
        counts.admin = Number(row.count)
      }
    }

    return success(counts)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to count active employees by category'
    return failure(message)
  }
}

// Sum pending employee request headcounts by department grouped by job title type
// Pending statuses: created(1), hod_reviewed(8), reviewed(2), approved(3), in_recruitment(6)
export async function sumPendingRequestsByDeptAndCategory(
  departmentId: number
): Promise<RepositoryResult<EmployeeCountByCategory>> {
  try {
    const pendingStatuses = [1, 8, 2, 3, 6] // created, hod_reviewed, reviewed, approved, in_recruitment

    const results = await prisma.$queryRaw<{ type: JobTitleType | null; total: bigint }[]>`
      SELECT jt.type, COUNT(*) as total
      FROM employee_request er
      INNER JOIN job_titles jt ON er.job_title_id = jt.id
      INNER JOIN department_job_title djt ON jt.id = djt.job_title_id AND djt.department_id = ${departmentId}
      WHERE er.status_employee_request IN (${Prisma.join(pendingStatuses)})
        AND er.is_deleted = 0
      GROUP BY jt.type
    `

    const counts: EmployeeCountByCategory = { technical: 0, admin: 0 }
    for (const row of results) {
      if (row.type === 'Technical') {
        counts.technical = Number(row.total)
      } else if (row.type === 'Administration') {
        counts.admin = Number(row.total)
      }
    }

    return success(counts)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sum pending requests by category'
    return failure(message)
  }
}

export type BudgetDocument = {
  url: string | null
  name: string | null
}

export async function updateDocument(
  id: number,
  url: string | null,
  name: string | null
): Promise<RepositoryResult<EmployeeBudgetWithRelations>> {
  try {
    const budget = await prisma.employeeBudget.update({
      where: { id },
      data: {
        document: url,
        documentName: name,
        updatedAt: new Date()
      },
      select: employeeBudgetSelectFields
    })
    return success(budget)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update budget document'
    return failure(message)
  }
}

export async function getDocument(id: number): Promise<RepositoryResult<BudgetDocument | null>> {
  try {
    const budget = await prisma.employeeBudget.findUnique({
      where: { id },
      select: { id: true, document: true, documentName: true }
    })

    if (!budget) return success(null)

    return success({
      url: budget.document,
      name: budget.documentName
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get budget document'
    return failure(message)
  }
}
