import type { Division, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type DivisionFilters = {
  name?: string
  code?: string
  obsId?: number
  isManagement?: boolean
}

export type PaginationParams = {
  page: number
  limit: number
}

export type DivisionWithRelations = Division & {
  obs?: { id: number; name: string } | null
  headOfDivision?: { employeeId: number; employeeName: string | null } | null
  deputyHead?: { employeeId: number; employeeName: string | null } | null
  _count?: { departments: number }
}

export type PaginatedResult = {
  items: DivisionWithRelations[]
  total: number
}

export type CreateDivisionData = {
  name: string
  code?: string
  obsId?: number
  isManagement?: boolean
  headOfDivisionId?: number
  deputyHeadId?: number
  description?: string
}

export type UpdateDivisionData = {
  name?: string
  code?: string
  obsId?: number | null
  isManagement?: boolean
  headOfDivisionId?: number | null
  deputyHeadId?: number | null
  description?: string
}

const divisionInclude = {
  obs: { select: { id: true, name: true } },
  headOfDivision: { select: { employeeId: true, employeeName: true } },
  deputyHead: { select: { employeeId: true, employeeName: true } },
  _count: { select: { departments: true } }
} as const

export async function findAll(
  filters: DivisionFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.DivisionWhereInput = {
      ...(filters.name && { name: { contains: filters.name } }),
      ...(filters.code && { code: { contains: filters.code } }),
      ...(filters.obsId && { obsId: filters.obsId }),
      ...(filters.isManagement !== undefined && { isManagement: filters.isManagement })
    }

    const [items, total] = await prisma.$transaction([
      prisma.division.findMany({
        where,
        include: divisionInclude,
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

export async function findById(id: number): Promise<RepositoryResult<DivisionWithRelations | null>> {
  try {
    const division = await prisma.division.findUnique({
      where: { id },
      include: divisionInclude
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
        isManagement: data.isManagement ?? false,
        ...(data.code !== undefined && { code: data.code }),
        ...(data.obsId !== undefined && { obsId: data.obsId }),
        ...(data.headOfDivisionId !== undefined && { headOfDivisionId: data.headOfDivisionId }),
        ...(data.deputyHeadId !== undefined && { deputyHeadId: data.deputyHeadId }),
        ...(data.description !== undefined && { description: data.description })
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
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.obsId !== undefined && { obsId: data.obsId }),
        ...(data.isManagement !== undefined && { isManagement: data.isManagement }),
        ...(data.headOfDivisionId !== undefined && { headOfDivisionId: data.headOfDivisionId }),
        ...(data.deputyHeadId !== undefined && { deputyHeadId: data.deputyHeadId }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date()
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

export async function assignHead(
  id: number,
  employeeId: number
): Promise<RepositoryResult<Division>> {
  try {
    const division = await prisma.division.update({
      where: { id },
      data: {
        headOfDivisionId: employeeId,
        updatedAt: new Date()
      }
    })
    return success(division)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign head of division'
    return failure(message)
  }
}

export async function removeHead(id: number): Promise<RepositoryResult<Division>> {
  try {
    const division = await prisma.division.update({
      where: { id },
      data: {
        headOfDivisionId: null,
        updatedAt: new Date()
      }
    })
    return success(division)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove head of division'
    return failure(message)
  }
}

export async function assignDeputy(
  id: number,
  employeeId: number
): Promise<RepositoryResult<Division>> {
  try {
    const division = await prisma.division.update({
      where: { id },
      data: {
        deputyHeadId: employeeId,
        updatedAt: new Date()
      }
    })
    return success(division)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign deputy head'
    return failure(message)
  }
}

export async function removeDeputy(id: number): Promise<RepositoryResult<Division>> {
  try {
    const division = await prisma.division.update({
      where: { id },
      data: {
        deputyHeadId: null,
        updatedAt: new Date()
      }
    })
    return success(division)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove deputy head'
    return failure(message)
  }
}

// Find all management divisions (for BOD level)
export async function findManagementDivisions(): Promise<RepositoryResult<DivisionWithRelations[]>> {
  try {
    const divisions = await prisma.division.findMany({
      where: { isManagement: true },
      include: divisionInclude,
      orderBy: { name: 'asc' }
    })
    return success(divisions)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch management divisions'
    return failure(message)
  }
}
