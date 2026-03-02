import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js'
import type { DepartmentCategory } from '../constants/departmentConstants.js'
import * as departmentRepository from '../repositories/departmentRepository.js'
import * as obsRepository from '../repositories/obsRepository.js'
import * as divisionRepository from '../repositories/divisionRepository.js'
import type { DepartmentWithRelations, DepartmentFilters, PaginationParams } from '../repositories/departmentRepository.js'

export type CreateDepartmentServiceData = {
  name: string
  code: string
  obsId: number
  divisionId?: number
  category: DepartmentCategory
  description?: string
}

export type UpdateDepartmentServiceData = {
  name: string
  code: string
  obsId: number
  divisionId?: number
  category: DepartmentCategory
  description?: string
}

export type PaginatedDepartments = {
  items: DepartmentWithRelations[]
  total: number
}

export async function getAllDepartments(
  filters: DepartmentFilters,
  pagination: PaginationParams
): Promise<PaginatedDepartments> {
  const result = await departmentRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getDepartmentById(id: number): Promise<DepartmentWithRelations> {
  const result = await departmentRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const department = result.getValue()
  if (!department) {
    throw new NotFoundError('Department not found')
  }

  return department
}

export async function createDepartment(data: CreateDepartmentServiceData): Promise<DepartmentWithRelations> {
  await validateForeignKeys(data.obsId, data.divisionId)
  await validateUniqueness(data.name, data.code)

  const result = await departmentRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateDepartment(id: number, data: UpdateDepartmentServiceData): Promise<DepartmentWithRelations> {
  const existingResult = await departmentRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Department not found')
  }

  await validateForeignKeys(data.obsId, data.divisionId)
  await validateUniquenessOnUpdate(id, data.name, data.code, existing)

  const result = await departmentRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteDepartment(id: number): Promise<void> {
  const existingResult = await departmentRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Department not found')
  }

  const result = await departmentRepository.remove(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

async function validateForeignKeys(obsId: number, divisionId?: number): Promise<void> {
  const obsResult = await obsRepository.findById(obsId)

  if (obsResult.isFailure()) {
    throw new Error(obsResult.error)
  }

  if (!obsResult.getValue()) {
    throw new ValidationError('OBS not found')
  }

  if (divisionId) {
    const divisionResult = await divisionRepository.findById(divisionId)

    if (divisionResult.isFailure()) {
      throw new Error(divisionResult.error)
    }

    if (!divisionResult.getValue()) {
      throw new ValidationError('Division not found')
    }
  }
}

async function validateUniqueness(name: string, code: string): Promise<void> {
  const nameExistsResult = await departmentRepository.nameExists(name)

  if (nameExistsResult.isFailure()) {
    throw new Error(nameExistsResult.error)
  }

  if (nameExistsResult.getValue()) {
    throw new ConflictError('Department name already exists')
  }

  const codeExistsResult = await departmentRepository.codeExists(code)

  if (codeExistsResult.isFailure()) {
    throw new Error(codeExistsResult.error)
  }

  if (codeExistsResult.getValue()) {
    throw new ConflictError('Department code already exists')
  }
}

async function validateUniquenessOnUpdate(
  id: number,
  name: string,
  code: string,
  existing: DepartmentWithRelations
): Promise<void> {
  if (name !== existing.name) {
    const nameExistsResult = await departmentRepository.nameExistsExcept(name, id)

    if (nameExistsResult.isFailure()) {
      throw new Error(nameExistsResult.error)
    }

    if (nameExistsResult.getValue()) {
      throw new ConflictError('Department name already exists')
    }
  }

  if (code !== existing.code) {
    const codeExistsResult = await departmentRepository.codeExistsExcept(code, id)

    if (codeExistsResult.isFailure()) {
      throw new Error(codeExistsResult.error)
    }

    if (codeExistsResult.getValue()) {
      throw new ConflictError('Department code already exists')
    }
  }
}
