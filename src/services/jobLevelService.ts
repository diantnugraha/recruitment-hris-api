import type { JobLevel, JobLevelCategory } from '@prisma/client'

import { NotFoundError, ConflictError } from '../errors/index.js'
import * as jobLevelRepository from '../repositories/jobLevelRepository.js'
import type {
  JobLevelFilters,
  PaginationParams
} from '../repositories/jobLevelRepository.js'

export type CreateJobLevelServiceData = {
  name: string
  category: JobLevelCategory
  description?: string
  can_create_job_title?: boolean
  can_create_kpi?: boolean
  order?: number
}

export type UpdateJobLevelServiceData = {
  name?: string
  category?: JobLevelCategory
  description?: string
  can_create_job_title?: boolean
  can_create_kpi?: boolean
  order?: number
}

export type PaginatedJobLevel = {
  items: JobLevel[]
  total: number
}

export async function getAllJobLevels(
  filters: JobLevelFilters,
  pagination: PaginationParams
): Promise<PaginatedJobLevel> {
  const result = await jobLevelRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getJobLevelById(id: number): Promise<JobLevel> {
  const bigIntId = BigInt(id)
  const result = await jobLevelRepository.findById(bigIntId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const jobLevel = result.getValue()
  if (!jobLevel) {
    throw new NotFoundError('Job level not found')
  }

  return jobLevel
}

export async function createJobLevel(data: CreateJobLevelServiceData): Promise<JobLevel> {
  const nameExistsResult = await jobLevelRepository.nameExists(data.name)

  if (nameExistsResult.isFailure()) {
    throw new Error(nameExistsResult.error)
  }

  if (nameExistsResult.getValue()) {
    throw new ConflictError('Job level name already exists')
  }

  const result = await jobLevelRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateJobLevel(
  id: number,
  data: UpdateJobLevelServiceData
): Promise<JobLevel> {
  const bigIntId = BigInt(id)
  const existingResult = await jobLevelRepository.findById(bigIntId)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Job level not found')
  }

  if (data.name && data.name !== existing.name) {
    const nameExistsResult = await jobLevelRepository.nameExistsExcept(data.name, bigIntId)

    if (nameExistsResult.isFailure()) {
      throw new Error(nameExistsResult.error)
    }

    if (nameExistsResult.getValue()) {
      throw new ConflictError('Job level name already exists')
    }
  }

  const result = await jobLevelRepository.update(bigIntId, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteJobLevel(id: number): Promise<void> {
  const bigIntId = BigInt(id)
  const existingResult = await jobLevelRepository.findById(bigIntId)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Job level not found')
  }

  const hasJobTitlesResult = await jobLevelRepository.hasJobTitles(bigIntId)

  if (hasJobTitlesResult.isFailure()) {
    throw new Error(hasJobTitlesResult.error)
  }

  if (hasJobTitlesResult.getValue()) {
    throw new ConflictError('Cannot delete job level with existing job titles')
  }

  const result = await jobLevelRepository.remove(bigIntId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}
