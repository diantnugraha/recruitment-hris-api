import type { JobLevel, Prisma, JobLevelCategory } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type JobLevelFilters = {
  name?: string
  category?: JobLevelCategory
  description?: string
  can_create_job_title?: boolean
  can_create_kpi?: boolean
  order_gte?: number
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: JobLevel[]
  total: number
}

export type CreateJobLevelData = {
  name: string
  category: JobLevelCategory
  description?: string
  can_create_job_title?: boolean
  can_create_kpi?: boolean
  order?: number
}

export type UpdateJobLevelData = {
  name?: string
  category?: JobLevelCategory
  description?: string
  can_create_job_title?: boolean
  can_create_kpi?: boolean
  order?: number
}

export async function findAll(
  filters: JobLevelFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.JobLevelWhereInput = {
      ...(filters.name && { name: { contains: filters.name } }),
      ...(filters.category && { category: filters.category }),
      ...(filters.description && { description: { contains: filters.description } }),
      ...(filters.can_create_job_title !== undefined && {
        canCreateJobTitle: filters.can_create_job_title
      }),
      ...(filters.can_create_kpi !== undefined && {
        canCreateKpi: filters.can_create_kpi
      }),
      ...(filters.order_gte !== undefined && {
        order: { gte: filters.order_gte }
      })
    }

    const [items, total] = await prisma.$transaction([
      prisma.jobLevel.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.jobLevel.count({ where })
    ])

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job level list'
    return failure(message)
  }
}

export async function findById(id: bigint): Promise<RepositoryResult<JobLevel | null>> {
  try {
    const jobLevel = await prisma.jobLevel.findUnique({
      where: { id }
    })
    return success(jobLevel)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find job level by id'
    return failure(message)
  }
}

export async function create(data: CreateJobLevelData): Promise<RepositoryResult<JobLevel>> {
  try {
    const jobLevel = await prisma.jobLevel.create({
      data: {
        name: data.name,
        category: data.category,
        canCreateJobTitle: data.can_create_job_title ?? false,
        canCreateKpi: data.can_create_kpi ?? false,
        ...(data.description !== undefined && { description: data.description }),
        ...(data.order !== undefined && { order: data.order })
      }
    })
    return success(jobLevel)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create job level'
    return failure(message)
  }
}

export async function update(
  id: bigint,
  data: UpdateJobLevelData
): Promise<RepositoryResult<JobLevel>> {
  try {
    const updateData: Prisma.JobLevelUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.description !== undefined) updateData.description = data.description
    if (data.can_create_job_title !== undefined) {
      updateData.canCreateJobTitle = data.can_create_job_title
    }
    if (data.can_create_kpi !== undefined) updateData.canCreateKpi = data.can_create_kpi
    if (data.order !== undefined) updateData.order = data.order

    const jobLevel = await prisma.jobLevel.update({
      where: { id },
      data: updateData
    })
    return success(jobLevel)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update job level'
    return failure(message)
  }
}

export async function remove(id: bigint): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.jobLevel.delete({
      where: { id }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete job level'
    return failure(message)
  }
}

export async function nameExists(name: string): Promise<RepositoryResult<boolean>> {
  try {
    const jobLevel = await prisma.jobLevel.findFirst({
      where: { name },
      select: { id: true }
    })
    return success(jobLevel !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function nameExistsExcept(
  name: string,
  exceptId: bigint
): Promise<RepositoryResult<boolean>> {
  try {
    const jobLevel = await prisma.jobLevel.findFirst({
      where: {
        name,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(jobLevel !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function hasJobTitles(id: bigint): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.jobTitle.count({
      where: { jobLevelId: id }
    })
    return success(count > 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check job titles'
    return failure(message)
  }
}
