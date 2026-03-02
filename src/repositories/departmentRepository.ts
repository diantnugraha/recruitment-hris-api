import type { Department, Obs, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'
import { type DepartmentCategory, toPrismaCategory } from '../constants/departmentConstants.js'

export type DepartmentWithRelations = Department & {
  obs: Pick<Obs, 'id' | 'name' | 'cluster'>
}

export type DepartmentFilters = {
  name?: string
  code?: string
  description?: string
  obsId?: number
  divisionId?: number
  category?: DepartmentCategory
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
  obsId: number
  divisionId?: number
  category: DepartmentCategory
  description?: string
}

export type UpdateDepartmentData = {
  name: string
  code: string
  obsId: number
  divisionId?: number
  category: DepartmentCategory
  description?: string
}

const departmentSelectFields = {
  id: true,
  name: true,
  code: true,
  obsId: true,
  divisionId: true,
  category: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  obs: {
    select: {
      id: true,
      name: true,
      cluster: true
    }
  }
} as const

export async function findAll(
  filters: DepartmentFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.DepartmentWhereInput = {
      ...(filters.name && { name: { contains: filters.name } }),
      ...(filters.code && { code: { contains: filters.code } }),
      ...(filters.description && { description: { contains: filters.description } }),
      ...(filters.obsId && { obsId: filters.obsId }),
      ...(filters.divisionId && { divisionId: filters.divisionId }),
      ...(filters.category && { category: toPrismaCategory(filters.category) })
    }

    const [items, total] = await prisma.$transaction([
      prisma.department.findMany({
        where,
        select: departmentSelectFields,
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
      select: departmentSelectFields
    })
    return success(department)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find department by id'
    return failure(message)
  }
}

export async function create(data: CreateDepartmentData): Promise<RepositoryResult<DepartmentWithRelations>> {
  try {
    const department = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        obsId: data.obsId,
        divisionId: data.divisionId,
        category: toPrismaCategory(data.category),
        description: data.description
      },
      select: departmentSelectFields
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
        name: data.name,
        code: data.code,
        obsId: data.obsId,
        divisionId: data.divisionId,
        category: toPrismaCategory(data.category),
        description: data.description
      },
      select: departmentSelectFields
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
