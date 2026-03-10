import type { JobTitle, JobTitleType, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type JobTitleWithRelations = JobTitle & {
  jobLevel: {
    id: bigint
    name: string
    category: string
  }
  division: {
    id: number
    name: string
    code: string | null
  } | null
  directReport: {
    id: bigint
    name: string
    jobLevel: {
      id: bigint
      name: string
      category: string
    }
  } | null
  departments: Array<{
    department: {
      id: number
      name: string
      code: string
      obs: {
        id: number
        name: string
        cluster: string | null
      }
    }
  }>
}

export type JobTitleFilters = {
  name?: string
  description?: string
  purpose?: string
  requirement?: string
  job_level_id?: number
  direct_report_id?: number
  department_ids?: number[]
  order_gte?: number
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: JobTitleWithRelations[]
  total: number
}

export type CreateJobTitleData = {
  name: string
  job_level_id: number
  division_id?: number
  direct_report_id?: number
  type?: JobTitleType
  description?: string
  purpose?: string
  requirement?: string
}

export type UpdateJobTitleData = {
  name?: string
  job_level_id?: number
  division_id?: number
  direct_report_id?: number
  type?: JobTitleType
  description?: string
  purpose?: string
  requirement?: string
}

function buildWhereClause(filters: JobTitleFilters): Prisma.JobTitleWhereInput {
  const where: Prisma.JobTitleWhereInput = {}

  if (filters.name) {
    where.name = { contains: filters.name }
  }

  if (filters.description) {
    where.description = { contains: filters.description }
  }

  if (filters.purpose) {
    where.purpose = { contains: filters.purpose }
  }

  if (filters.requirement) {
    where.requirement = { contains: filters.requirement }
  }

  if (filters.job_level_id !== undefined) {
    where.jobLevelId = BigInt(filters.job_level_id)
  }

  if (filters.direct_report_id !== undefined) {
    where.directReportId = BigInt(filters.direct_report_id)
  }

  if (filters.department_ids && filters.department_ids.length > 0) {
    where.departments = {
      some: {
        departmentId: {
          in: filters.department_ids
        }
      }
    }
  }

  if (filters.order_gte !== undefined) {
    where.jobLevel = {
      order: {
        gte: filters.order_gte
      }
    }
  }

  return where
}

const includeRelations = {
  jobLevel: {
    select: {
      id: true,
      name: true,
      category: true
    }
  },
  division: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  directReport: {
    select: {
      id: true,
      name: true,
      jobLevel: {
        select: {
          id: true,
          name: true,
          category: true
        }
      }
    }
  },
  departments: {
    select: {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
          obs: {
            select: {
              id: true,
              name: true,
              cluster: true
            }
          }
        }
      }
    }
  }
}

export async function findAll(
  filters: JobTitleFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where = buildWhereClause(filters)

    const [items, total] = await prisma.$transaction([
      prisma.jobTitle.findMany({
        where,
        include: includeRelations,
        orderBy: { name: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.jobTitle.count({ where })
    ])

    return success({ items: items as JobTitleWithRelations[], total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job title list'
    return failure(message)
  }
}

export async function findById(id: bigint): Promise<RepositoryResult<JobTitleWithRelations | null>> {
  try {
    const jobTitle = await prisma.jobTitle.findUnique({
      where: { id },
      include: includeRelations
    })
    return success(jobTitle as JobTitleWithRelations | null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find job title by id'
    return failure(message)
  }
}

export async function create(data: CreateJobTitleData): Promise<RepositoryResult<JobTitle>> {
  try {
    const jobTitle = await prisma.jobTitle.create({
      data: {
        name: data.name,
        jobLevelId: BigInt(data.job_level_id),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.division_id !== undefined && { divisionId: data.division_id }),
        ...(data.direct_report_id !== undefined && {
          directReportId: BigInt(data.direct_report_id)
        }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.purpose !== undefined && { purpose: data.purpose }),
        ...(data.requirement !== undefined && { requirement: data.requirement })
      }
    })
    return success(jobTitle)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create job title'
    return failure(message)
  }
}

export async function update(
  id: bigint,
  data: UpdateJobTitleData
): Promise<RepositoryResult<JobTitle>> {
  try {
    const updateData: Prisma.JobTitleUncheckedUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.job_level_id !== undefined && { jobLevelId: BigInt(data.job_level_id) }),
      ...(data.division_id !== undefined && { divisionId: data.division_id }),
      ...(data.direct_report_id !== undefined && {
        directReportId: BigInt(data.direct_report_id)
      }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.purpose !== undefined && { purpose: data.purpose }),
      ...(data.requirement !== undefined && { requirement: data.requirement }),
      updatedAt: new Date()
    }

    const jobTitle = await prisma.jobTitle.update({
      where: { id },
      data: updateData
    })
    return success(jobTitle)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update job title'
    return failure(message)
  }
}

export async function remove(id: bigint): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.jobTitle.delete({
      where: { id }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete job title'
    return failure(message)
  }
}

export async function syncDepartments(
  jobTitleId: bigint,
  departmentIds: number[]
): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.departmentJobTitle.deleteMany({
        where: { jobTitleId }
      })

      if (departmentIds.length > 0) {
        await tx.departmentJobTitle.createMany({
          data: departmentIds.map((departmentId) => ({
            jobTitleId,
            departmentId
          }))
        })
      }
    })

    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync departments'
    return failure(message)
  }
}

export async function attachDepartments(
  jobTitleId: bigint,
  departmentIds: number[]
): Promise<RepositoryResult<boolean>> {
  try {
    const existingRecords = await prisma.departmentJobTitle.findMany({
      where: {
        jobTitleId,
        departmentId: { in: departmentIds }
      },
      select: { departmentId: true }
    })

    const existingDepartmentIds = new Set(existingRecords.map((r) => r.departmentId))
    const newDepartmentIds = departmentIds.filter((id) => !existingDepartmentIds.has(id))

    if (newDepartmentIds.length > 0) {
      await prisma.departmentJobTitle.createMany({
        data: newDepartmentIds.map((departmentId) => ({
          jobTitleId,
          departmentId
        }))
      })
    }

    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to attach departments'
    return failure(message)
  }
}

export async function detachDepartments(
  jobTitleId: bigint,
  departmentIds: number[]
): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.departmentJobTitle.deleteMany({
      where: {
        jobTitleId,
        departmentId: { in: departmentIds }
      }
    })

    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to detach departments'
    return failure(message)
  }
}

export async function detachAllDepartments(
  jobTitleId: bigint
): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.departmentJobTitle.deleteMany({
      where: { jobTitleId }
    })

    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to detach all departments'
    return failure(message)
  }
}

export async function nameExists(name: string): Promise<RepositoryResult<boolean>> {
  try {
    const jobTitle = await prisma.jobTitle.findFirst({
      where: { name },
      select: { id: true }
    })
    return success(jobTitle !== null)
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
    const jobTitle = await prisma.jobTitle.findFirst({
      where: {
        name,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(jobTitle !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function jobLevelExists(jobLevelId: number): Promise<RepositoryResult<boolean>> {
  try {
    const jobLevel = await prisma.jobLevel.findUnique({
      where: { id: BigInt(jobLevelId) },
      select: { id: true }
    })
    return success(jobLevel !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check job level existence'
    return failure(message)
  }
}

export async function divisionExists(divisionId: number): Promise<RepositoryResult<boolean>> {
  try {
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      select: { id: true }
    })
    return success(division !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check division existence'
    return failure(message)
  }
}

export async function jobTitleExists(jobTitleId: number): Promise<RepositoryResult<boolean>> {
  try {
    const jobTitle = await prisma.jobTitle.findUnique({
      where: { id: BigInt(jobTitleId) },
      select: { id: true }
    })
    return success(jobTitle !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check job title existence'
    return failure(message)
  }
}

export async function departmentsExist(
  departmentIds: number[]
): Promise<RepositoryResult<number[]>> {
  try {
    const departments = await prisma.department.findMany({
      where: {
        id: { in: departmentIds }
      },
      select: { id: true }
    })
    return success(departments.map((d) => d.id))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check department existence'
    return failure(message)
  }
}

export async function wouldCreateCircularReference(
  jobTitleId: bigint,
  directReportId: bigint
): Promise<RepositoryResult<boolean>> {
  try {
    if (jobTitleId === directReportId) {
      return success(true)
    }

    let currentId: bigint | null = directReportId
    const visited = new Set<string>()

    while (currentId !== null) {
      const currentIdStr = currentId.toString()

      if (visited.has(currentIdStr)) {
        return success(false)
      }

      visited.add(currentIdStr)

      if (currentId === jobTitleId) {
        return success(true)
      }

      const found: { directReportId: bigint | null } | null = await prisma.jobTitle.findUnique({
        where: { id: currentId },
        select: { directReportId: true }
      })

      currentId = found?.directReportId ?? null
    }

    return success(false)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check circular reference'
    return failure(message)
  }
}
