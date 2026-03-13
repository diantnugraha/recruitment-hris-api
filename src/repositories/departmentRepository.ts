import type { Department, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type DepartmentWithRelations = Department & {
  division?: {
    id: number
    name: string
    isManagement: boolean
    obs?: { id: number; name: string } | null
  } | null
  manager?: { employeeId: number; employeeName: string | null } | null
  _count?: { employees: number; jobTitles: number }
}

export type DepartmentFilters = {
  name?: string
  code?: string
  divisionId?: number
  category?: string
  isManagement?: boolean
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: DepartmentWithRelations[]
  total: number
}

export type CreateDepartmentData = {
  name: string
  code: string
  divisionId: number
  managerId?: number
  category?: string
  description?: string
}

export type UpdateDepartmentData = {
  name?: string
  code?: string
  divisionId?: number
  managerId?: number | null
  category?: string
  description?: string
}

const departmentInclude = {
  division: {
    select: {
      id: true,
      name: true,
      isManagement: true,
      obs: { select: { id: true, name: true } }
    }
  },
  manager: { select: { employeeId: true, employeeName: true } },
  _count: { select: { employees: true, jobTitles: true } }
} as const

export async function findAll(
  filters: DepartmentFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.DepartmentWhereInput = {
      // Ensure division exists to prevent "Field division is required" errors
      division: filters.isManagement !== undefined
        ? { isManagement: filters.isManagement }
        : { id: { gt: 0 } },
      ...(filters.name && { name: { contains: filters.name } }),
      ...(filters.code && { code: { contains: filters.code } }),
      ...(filters.divisionId && { divisionId: filters.divisionId }),
      ...(filters.category && { category: filters.category })
    }

    const [items, total] = await prisma.$transaction([
      prisma.department.findMany({
        where,
        include: departmentInclude,
        orderBy: { name: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.department.count({ where })
    ])

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch departments'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<DepartmentWithRelations | null>> {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: departmentInclude
    })
    return success(department)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find department by id'
    return failure(message)
  }
}

export async function findByDivisionId(divisionId: number): Promise<RepositoryResult<DepartmentWithRelations[]>> {
  try {
    const departments = await prisma.department.findMany({
      where: { divisionId },
      include: departmentInclude,
      orderBy: { name: 'asc' }
    })
    return success(departments)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch departments by division'
    return failure(message)
  }
}

export async function create(data: CreateDepartmentData): Promise<RepositoryResult<DepartmentWithRelations>> {
  try {
    const department = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        divisionId: data.divisionId,
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description })
      },
      include: departmentInclude
    })
    return success(department)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create department'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateDepartmentData): Promise<RepositoryResult<DepartmentWithRelations>> {
  try {
    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.divisionId !== undefined && { divisionId: data.divisionId }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date()
      },
      include: departmentInclude
    })
    return success(department)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update department'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.department.delete({
      where: { id }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete department'
    return failure(message)
  }
}

export async function nameExists(name: string): Promise<RepositoryResult<boolean>> {
  try {
    const department = await prisma.department.findFirst({
      where: { name },
      select: { id: true }
    })
    return success(department !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function nameExistsExcept(name: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const department = await prisma.department.findFirst({
      where: {
        name,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(department !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function codeExists(code: string): Promise<RepositoryResult<boolean>> {
  try {
    const department = await prisma.department.findFirst({
      where: { code },
      select: { id: true }
    })
    return success(department !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check code existence'
    return failure(message)
  }
}

export async function codeExistsExcept(code: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const department = await prisma.department.findFirst({
      where: {
        code,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(department !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check code existence'
    return failure(message)
  }
}

export async function hasEmployees(id: number): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.employee.count({
      where: { departmentId: id }
    })
    return success(count > 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check employees'
    return failure(message)
  }
}

export async function assignManager(
  id: number,
  employeeId: number
): Promise<RepositoryResult<DepartmentWithRelations>> {
  try {
    const department = await prisma.department.update({
      where: { id },
      data: {
        managerId: employeeId,
        updatedAt: new Date()
      },
      include: departmentInclude
    })
    return success(department)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign manager'
    return failure(message)
  }
}

export async function removeManager(id: number): Promise<RepositoryResult<DepartmentWithRelations>> {
  try {
    const department = await prisma.department.update({
      where: { id },
      data: {
        managerId: null,
        updatedAt: new Date()
      },
      include: departmentInclude
    })
    return success(department)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove manager'
    return failure(message)
  }
}
