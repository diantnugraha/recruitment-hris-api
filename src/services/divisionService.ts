import type { Division } from '@prisma/client'

import { NotFoundError, ConflictError } from '../errors/index.js'
import * as divisionRepository from '../repositories/divisionRepository.js'
import type { DivisionFilters, PaginationParams } from '../repositories/divisionRepository.js'

export type CreateDivisionServiceData = {
  name: string
  code?: string
  description?: string
}

export type UpdateDivisionServiceData = {
  name: string
  code?: string
  description?: string
}

export type PaginatedDivisions = {
  items: Division[]
  total: number
}

export async function getAllDivisions(
  filters: DivisionFilters,
  pagination: PaginationParams
): Promise<PaginatedDivisions> {
  const result = await divisionRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getDivisionById(id: number): Promise<Division> {
  const result = await divisionRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const division = result.getValue()
  if (!division) {
    throw new NotFoundError('Division not found')
  }

  return division
}

export async function createDivision(data: CreateDivisionServiceData): Promise<Division> {
  const nameExistsResult = await divisionRepository.nameExists(data.name)

  if (nameExistsResult.isFailure()) {
    throw new Error(nameExistsResult.error)
  }

  if (nameExistsResult.getValue()) {
    throw new ConflictError('Division name already exists')
  }

  const result = await divisionRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateDivision(id: number, data: UpdateDivisionServiceData): Promise<Division> {
  const existingResult = await divisionRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Division not found')
  }

  if (data.name !== existing.name) {
    const nameExistsResult = await divisionRepository.nameExistsExcept(data.name, id)

    if (nameExistsResult.isFailure()) {
      throw new Error(nameExistsResult.error)
    }

    if (nameExistsResult.getValue()) {
      throw new ConflictError('Division name already exists')
    }
  }

  const result = await divisionRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteDivision(id: number): Promise<void> {
  const existingResult = await divisionRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Division not found')
  }

  const hasDepartmentsResult = await divisionRepository.hasDepartments(id)

  if (hasDepartmentsResult.isFailure()) {
    throw new Error(hasDepartmentsResult.error)
  }

  if (hasDepartmentsResult.getValue()) {
    throw new ConflictError('Cannot delete division with existing departments')
  }

  const result = await divisionRepository.remove(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}
