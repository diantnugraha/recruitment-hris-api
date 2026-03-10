import type { EmployeeBudget, Department, Prisma } from '@prisma/client'

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
  document?: string
}

export type UpdateEmployeeBudgetData = {
  departmentId?: number
  year?: number
  technical?: number
  admin?: number
  document?: string
}

const employeeBudgetSelectFields = {
  id: true,
  departmentId: true,
  year: true,
  technical: true,
  admin: true,
  document: true,
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
        document: data.document
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
