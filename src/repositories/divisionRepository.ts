import type { Division, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type DivisionFilters = {
  name?: string
  code?: string
  description?: string
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: Division[]
  total: number
}

export type CreateDivisionData = {
  name: string
  code?: string
  description?: string
}

export type UpdateDivisionData = {
  name: string
  code?: string
  description?: string
}

export async function findAll(
  filters: DivisionFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.DivisionWhereInput = {
      ...(filters.name && { name: { contains: filters.name } }),
      ...(filters.code && { code: { contains: filters.code } }),
      ...(filters.description && { description: { contains: filters.description } })
    }

    const [items, total] = await prisma.$transaction([
      prisma.division.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.division.count({ where })
    ])

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch divisions'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<Division | null>> {
  try {
    const division = await prisma.division.findUnique({
      where: { id }
    })
    return success(division)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find division by id'
    return failure(message)
  }
}

export async function create(data: CreateDivisionData): Promise<RepositoryResult<Division>> {
  try {
    const division = await prisma.division.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description
      }
    })
    return success(division)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create division'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateDivisionData): Promise<RepositoryResult<Division>> {
  try {
    const division = await prisma.division.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description
      }
    })
    return success(division)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update division'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.division.delete({
      where: { id }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete division'
    return failure(message)
  }
}

export async function nameExists(name: string): Promise<RepositoryResult<boolean>> {
  try {
    const division = await prisma.division.findFirst({
      where: { name },
      select: { id: true }
    })
    return success(division !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function nameExistsExcept(name: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const division = await prisma.division.findFirst({
      where: {
        name,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(division !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function hasDepartments(id: number): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.department.count({
      where: { divisionId: id }
    })
    return success(count > 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check departments'
    return failure(message)
  }
}
