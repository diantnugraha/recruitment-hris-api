import type { Obs } from '@prisma/client'

import { NotFoundError, ConflictError } from '../errors/index.js'
import * as obsRepository from '../repositories/obsRepository.js'
import type { ObsFilters, PaginationParams, ObsWithRelations } from '../repositories/obsRepository.js'

export type CreateObsServiceData = {
  name: string
  cluster?: string
  description?: string
}

export type UpdateObsServiceData = {
  name?: string
  cluster?: string
  description?: string
}

export type PaginatedObs = {
  items: ObsWithRelations[]
  total: number
}

export async function getAllObs(
  filters: ObsFilters,
  pagination: PaginationParams
): Promise<PaginatedObs> {
  const result = await obsRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getObsById(id: number): Promise<ObsWithRelations> {
  const result = await obsRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const obs = result.getValue()
  if (!obs) {
    throw new NotFoundError('OBS not found')
  }

  return obs
}

export async function createObs(data: CreateObsServiceData): Promise<Obs> {
  const nameExistsResult = await obsRepository.nameExists(data.name)

  if (nameExistsResult.isFailure()) {
    throw new Error(nameExistsResult.error)
  }

  if (nameExistsResult.getValue()) {
    throw new ConflictError('OBS name already exists')
  }

  const result = await obsRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateObs(id: number, data: UpdateObsServiceData): Promise<Obs> {
  const existingResult = await obsRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('OBS not found')
  }

  if (data.name && data.name !== existing.name) {
    const nameExistsResult = await obsRepository.nameExistsExcept(data.name, id)

    if (nameExistsResult.isFailure()) {
      throw new Error(nameExistsResult.error)
    }

    if (nameExistsResult.getValue()) {
      throw new ConflictError('OBS name already exists')
    }
  }

  const result = await obsRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteObs(id: number): Promise<void> {
  const existingResult = await obsRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('OBS not found')
  }

  const hasDivisionsResult = await obsRepository.hasDivisions(id)

  if (hasDivisionsResult.isFailure()) {
    throw new Error(hasDivisionsResult.error)
  }

  if (hasDivisionsResult.getValue()) {
    throw new ConflictError('Cannot delete OBS with existing divisions')
  }

  const result = await obsRepository.remove(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}
