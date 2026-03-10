import type { Obs, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type ObsFilters = {
  name?: string
  cluster?: string
  description?: string
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: Obs[]
  total: number
}

export type CreateObsData = {
  name: string
  cluster?: string
  description?: string
}

export type UpdateObsData = {
  name: string
  cluster?: string
  description?: string
}

export async function findAll(
  filters: ObsFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.ObsWhereInput = {
      ...(filters.name && { name: { contains: filters.name } }),
      ...(filters.cluster && { cluster: { contains: filters.cluster } }),
      ...(filters.description && { description: { contains: filters.description } })
    }

    const [items, total] = await prisma.$transaction([
      prisma.obs.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.obs.count({ where })
    ])

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch OBS list'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<Obs | null>> {
  try {
    const obs = await prisma.obs.findUnique({
      where: { id }
    })
    return success(obs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find OBS by id'
    return failure(message)
  }
}

export async function create(data: CreateObsData): Promise<RepositoryResult<Obs>> {
  try {
    const obs = await prisma.obs.create({
      data: {
        name: data.name,
        cluster: data.cluster,
        description: data.description
      }
    })
    return success(obs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create OBS'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateObsData): Promise<RepositoryResult<Obs>> {
  try {
    const obs = await prisma.obs.update({
      where: { id },
      data: {
        name: data.name,
        cluster: data.cluster,
        description: data.description,
        updatedAt: new Date()
      }
    })
    return success(obs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update OBS'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.obs.delete({
      where: { id }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete OBS'
    return failure(message)
  }
}

export async function nameExists(name: string): Promise<RepositoryResult<boolean>> {
  try {
    const obs = await prisma.obs.findFirst({
      where: { name },
      select: { id: true }
    })
    return success(obs !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function nameExistsExcept(name: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const obs = await prisma.obs.findFirst({
      where: {
        name,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(obs !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function hasDepartments(id: number): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.department.count({
      where: { obsId: id }
    })
    return success(count > 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check departments'
    return failure(message)
  }
}
