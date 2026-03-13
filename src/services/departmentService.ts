import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js'
import * as departmentRepository from '../repositories/departmentRepository.js'
import * as divisionRepository from '../repositories/divisionRepository.js'
import type {
  DepartmentWithRelations,
  DepartmentFilters,
  PaginationParams
} from '../repositories/departmentRepository.js'

export type CreateDepartmentServiceData = {
  name: string
  code: string
  divisionId: number
  managerId?: number
  category?: string
  description?: string
}

export type UpdateDepartmentServiceData = {
  name?: string
  code?: string
  divisionId?: number
  managerId?: number | null
  category?: string
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

export async function getDepartmentsByDivision(divisionId: number): Promise<DepartmentWithRelations[]> {
  const result = await departmentRepository.findByDivisionId(divisionId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function createDepartment(data: CreateDepartmentServiceData): Promise<DepartmentWithRelations> {
  await validateDivisionExists(data.divisionId)
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

  if (data.divisionId) {
    await validateDivisionExists(data.divisionId)
  }

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

  // Check if department has employees
  const hasEmployeesResult = await departmentRepository.hasEmployees(id)

  if (hasEmployeesResult.isFailure()) {
    throw new Error(hasEmployeesResult.error)
  }

  if (hasEmployeesResult.getValue()) {
    throw new ConflictError('Cannot delete department with existing employees')
  }

  const result = await departmentRepository.remove(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

export async function assignManager(id: number, employeeId: number): Promise<DepartmentWithRelations> {
  const existingResult = await departmentRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Department not found')
  }

  const result = await departmentRepository.assignManager(id, employeeId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function removeManager(id: number): Promise<DepartmentWithRelations> {
  const existingResult = await departmentRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Department not found')
  }

  const result = await departmentRepository.removeManager(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

async function validateDivisionExists(divisionId: number): Promise<void> {
  const divisionResult = await divisionRepository.findById(divisionId)

  if (divisionResult.isFailure()) {
    throw new Error(divisionResult.error)
  }

  if (!divisionResult.getValue()) {
    throw new ValidationError('Division not found')
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
  name: string | undefined,
  code: string | undefined,
  existing: DepartmentWithRelations
): Promise<void> {
  if (name && name !== existing.name) {
    const nameExistsResult = await departmentRepository.nameExistsExcept(name, id)

    if (nameExistsResult.isFailure()) {
      throw new Error(nameExistsResult.error)
    }

    if (nameExistsResult.getValue()) {
      throw new ConflictError('Department name already exists')
    }
  }

  if (code && code !== existing.code) {
    const codeExistsResult = await departmentRepository.codeExistsExcept(code, id)

    if (codeExistsResult.isFailure()) {
      throw new Error(codeExistsResult.error)
    }

    if (codeExistsResult.getValue()) {
      throw new ConflictError('Department code already exists')
    }
  }
}
