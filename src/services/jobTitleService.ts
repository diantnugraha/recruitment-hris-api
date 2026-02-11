import type { JobTitleType } from '@prisma/client'

import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js'
import * as jobTitleRepository from '../repositories/jobTitleRepository.js'
import type {
  JobTitleWithRelations,
  JobTitleFilters,
  PaginationParams
} from '../repositories/jobTitleRepository.js'
import { prisma } from '../config/database.js'

export type CreateJobTitleServiceData = {
  name: string
  job_level_id: number
  division_id?: number
  direct_report_id?: number
  type?: JobTitleType
  description?: string
  purpose?: string
  requirement?: string
  department_sync?: number[]
  department_attach?: number[]
}

export type UpdateJobTitleServiceData = {
  name?: string
  job_level_id?: number
  division_id?: number
  direct_report_id?: number
  type?: JobTitleType
  description?: string
  purpose?: string
  requirement?: string
  department_attach?: number[]
  department_detach?: number[]
  department_sync?: number[]
}

export type PaginatedJobTitle = {
  items: JobTitleWithRelations[]
  total: number
}

async function validateForeignKeys(data: {
  job_level_id?: number
  division_id?: number
  direct_report_id?: number
  department_ids?: number[]
}): Promise<void> {
  if (data.job_level_id !== undefined) {
    const jobLevelExistsResult = await jobTitleRepository.jobLevelExists(data.job_level_id)
    if (jobLevelExistsResult.isFailure()) {
      throw new Error(jobLevelExistsResult.error)
    }
    if (!jobLevelExistsResult.getValue()) {
      throw new ValidationError('Job level not found')
    }
  }

  if (data.division_id !== undefined) {
    const divisionExistsResult = await jobTitleRepository.divisionExists(data.division_id)
    if (divisionExistsResult.isFailure()) {
      throw new Error(divisionExistsResult.error)
    }
    if (!divisionExistsResult.getValue()) {
      throw new ValidationError('Division not found')
    }
  }

  if (data.direct_report_id !== undefined) {
    const jobTitleExistsResult = await jobTitleRepository.jobTitleExists(data.direct_report_id)
    if (jobTitleExistsResult.isFailure()) {
      throw new Error(jobTitleExistsResult.error)
    }
    if (!jobTitleExistsResult.getValue()) {
      throw new ValidationError('Direct report job title not found')
    }
  }

  if (data.department_ids && data.department_ids.length > 0) {
    const departmentsExistResult = await jobTitleRepository.departmentsExist(data.department_ids)
    if (departmentsExistResult.isFailure()) {
      throw new Error(departmentsExistResult.error)
    }
    const existingDepartmentIds = departmentsExistResult.getValue()
    const missingDepartmentIds = data.department_ids.filter(
      (id) => !existingDepartmentIds.includes(id)
    )
    if (missingDepartmentIds.length > 0) {
      throw new ValidationError(`Departments not found: ${missingDepartmentIds.join(', ')}`)
    }
  }
}

export async function getAllJobTitles(
  filters: JobTitleFilters,
  pagination: PaginationParams
): Promise<PaginatedJobTitle> {
  const result = await jobTitleRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getJobTitleById(id: number): Promise<JobTitleWithRelations> {
  const bigIntId = BigInt(id)
  const result = await jobTitleRepository.findById(bigIntId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const jobTitle = result.getValue()
  if (!jobTitle) {
    throw new NotFoundError('Job title not found')
  }

  return jobTitle
}

export async function createJobTitle(
  data: CreateJobTitleServiceData
): Promise<JobTitleWithRelations> {
  const nameExistsResult = await jobTitleRepository.nameExists(data.name)

  if (nameExistsResult.isFailure()) {
    throw new Error(nameExistsResult.error)
  }

  if (nameExistsResult.getValue()) {
    throw new ConflictError('Job title name already exists')
  }

  const departmentIds = [
    ...(data.department_sync || []),
    ...(data.department_attach || [])
  ]

  await validateForeignKeys({
    job_level_id: data.job_level_id,
    ...(data.division_id !== undefined && { division_id: data.division_id }),
    ...(data.direct_report_id !== undefined && { direct_report_id: data.direct_report_id }),
    ...(departmentIds.length > 0 && { department_ids: departmentIds })
  })

  if (data.direct_report_id !== undefined) {
    const circularRefResult = await jobTitleRepository.wouldCreateCircularReference(
      BigInt(0),
      BigInt(data.direct_report_id)
    )
    if (circularRefResult.isFailure()) {
      throw new Error(circularRefResult.error)
    }
  }

  return await prisma.$transaction(async () => {
    const createResult = await jobTitleRepository.create({
      name: data.name,
      job_level_id: data.job_level_id,
      ...(data.type !== undefined && { type: data.type }),
      ...(data.division_id !== undefined && { division_id: data.division_id }),
      ...(data.direct_report_id !== undefined && { direct_report_id: data.direct_report_id }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.purpose !== undefined && { purpose: data.purpose }),
      ...(data.requirement !== undefined && { requirement: data.requirement })
    })

    if (createResult.isFailure()) {
      throw new Error(createResult.error)
    }

    const jobTitle = createResult.getValue()

    if (data.department_sync && data.department_sync.length > 0) {
      const syncResult = await jobTitleRepository.syncDepartments(
        jobTitle.id,
        data.department_sync
      )
      if (syncResult.isFailure()) {
        throw new Error(syncResult.error)
      }
    } else if (data.department_attach && data.department_attach.length > 0) {
      const attachResult = await jobTitleRepository.attachDepartments(
        jobTitle.id,
        data.department_attach
      )
      if (attachResult.isFailure()) {
        throw new Error(attachResult.error)
      }
    }

    const finalResult = await jobTitleRepository.findById(jobTitle.id)
    if (finalResult.isFailure()) {
      throw new Error(finalResult.error)
    }

    const finalJobTitle = finalResult.getValue()
    if (!finalJobTitle) {
      throw new Error('Failed to retrieve created job title')
    }

    return finalJobTitle
  })
}

export async function updateJobTitle(
  id: number,
  data: UpdateJobTitleServiceData
): Promise<JobTitleWithRelations> {
  const bigIntId = BigInt(id)
  const existingResult = await jobTitleRepository.findById(bigIntId)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Job title not found')
  }

  if (data.name && data.name !== existing.name) {
    const nameExistsResult = await jobTitleRepository.nameExistsExcept(data.name, bigIntId)

    if (nameExistsResult.isFailure()) {
      throw new Error(nameExistsResult.error)
    }

    if (nameExistsResult.getValue()) {
      throw new ConflictError('Job title name already exists')
    }
  }

  const departmentIds = [
    ...(data.department_sync || []),
    ...(data.department_attach || []),
    ...(data.department_detach || [])
  ]

  await validateForeignKeys({
    ...(data.job_level_id !== undefined && { job_level_id: data.job_level_id }),
    ...(data.division_id !== undefined && { division_id: data.division_id }),
    ...(data.direct_report_id !== undefined && { direct_report_id: data.direct_report_id }),
    ...(departmentIds.length > 0 && { department_ids: departmentIds })
  })

  if (data.direct_report_id !== undefined) {
    const circularRefResult = await jobTitleRepository.wouldCreateCircularReference(
      bigIntId,
      BigInt(data.direct_report_id)
    )
    if (circularRefResult.isFailure()) {
      throw new Error(circularRefResult.error)
    }
    if (circularRefResult.getValue()) {
      throw new ValidationError('Cannot set direct report: would create circular reference')
    }
  }

  return await prisma.$transaction(async () => {
    const updateResult = await jobTitleRepository.update(bigIntId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.job_level_id !== undefined && { job_level_id: data.job_level_id }),
      ...(data.division_id !== undefined && { division_id: data.division_id }),
      ...(data.direct_report_id !== undefined && { direct_report_id: data.direct_report_id }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.purpose !== undefined && { purpose: data.purpose }),
      ...(data.requirement !== undefined && { requirement: data.requirement })
    })

    if (updateResult.isFailure()) {
      throw new Error(updateResult.error)
    }

    if (data.department_attach && data.department_attach.length > 0) {
      const attachResult = await jobTitleRepository.attachDepartments(
        bigIntId,
        data.department_attach
      )
      if (attachResult.isFailure()) {
        throw new Error(attachResult.error)
      }
    }

    if (data.department_detach && data.department_detach.length > 0) {
      const detachResult = await jobTitleRepository.detachDepartments(
        bigIntId,
        data.department_detach
      )
      if (detachResult.isFailure()) {
        throw new Error(detachResult.error)
      }
    }

    if (data.department_sync) {
      const syncResult = await jobTitleRepository.syncDepartments(bigIntId, data.department_sync)
      if (syncResult.isFailure()) {
        throw new Error(syncResult.error)
      }
    }

    const finalResult = await jobTitleRepository.findById(bigIntId)
    if (finalResult.isFailure()) {
      throw new Error(finalResult.error)
    }

    const finalJobTitle = finalResult.getValue()
    if (!finalJobTitle) {
      throw new Error('Failed to retrieve updated job title')
    }

    return finalJobTitle
  })
}

export async function deleteJobTitle(id: number): Promise<void> {
  const bigIntId = BigInt(id)
  const existingResult = await jobTitleRepository.findById(bigIntId)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Job title not found')
  }

  await prisma.$transaction(async () => {
    const detachResult = await jobTitleRepository.detachAllDepartments(bigIntId)
    if (detachResult.isFailure()) {
      throw new Error(detachResult.error)
    }

    const removeResult = await jobTitleRepository.remove(bigIntId)
    if (removeResult.isFailure()) {
      throw new Error(removeResult.error)
    }
  })
}
