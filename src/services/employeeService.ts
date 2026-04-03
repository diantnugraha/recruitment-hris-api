import { randomBytes } from 'crypto'
import type { Employee } from '@prisma/client'

import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js'
import * as employeeRepository from '../repositories/employeeRepository.js'
import type { EmployeeFilters, PaginationParams } from '../repositories/employeeRepository.js'
import { updateStructuralPosition, clearStructuralPositions } from './organizationService.js'
import * as userRestService from './userRestService.js'
import * as roleRepository from '../repositories/roleRepository.js'

const DEFAULT_EMPLOYEE_ROLE_NAME = 'Employee'

export type CreateEmployeeServiceData = {
  name: string
  nickname?: string
  email?: string
  contact?: string
  gender?: string
  status?: string
  title?: string
  departmentId?: number
  location?: string
  businessUnit?: string
  extension?: string
  joinDate?: Date
  birthDate?: Date
  permanentDate?: Date
  superiorId?: number
  nik?: string
  maritalStatus?: string
  address?: string
  religion?: string
  ethnic?: string
  nationality?: string
  jobTitleId?: number
  motherName?: string
  fatherName?: string
  spouseName?: string
  emergencyName?: string
  emergencyRelation?: string
  emergencyPhone?: string
}

export type UpdateEmployeeServiceData = {
  name?: string
  nickname?: string
  email?: string
  contact?: string
  gender?: string
  status?: string
  title?: string
  departmentId?: number | null
  location?: string
  businessUnit?: string
  extension?: string
  joinDate?: Date
  birthDate?: Date
  permanentDate?: Date
  superiorId?: number | null
  nik?: string
  maritalStatus?: string
  address?: string
  religion?: string
  ethnic?: string
  motherName?: string
  fatherName?: string
  spouseName?: string
  emergencyName?: string
  emergencyRelation?: string
  emergencyPhone?: string
}

export type PaginatedEmployees = {
  items: Employee[]
  total: number
}

export async function getAllEmployees(
  filters: EmployeeFilters,
  pagination: PaginationParams
): Promise<PaginatedEmployees> {
  const result = await employeeRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getEmployeeById(id: number): Promise<Employee> {
  const result = await employeeRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const employee = result.getValue()
  if (!employee) {
    throw new NotFoundError('Employee not found')
  }

  return employee
}

export async function getEmployeeByUuid(uuid: string): Promise<Employee> {
  const result = await employeeRepository.findByUuid(uuid)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const employee = result.getValue()
  if (!employee) {
    throw new NotFoundError('Employee not found')
  }

  return employee
}

export async function createEmployee(data: CreateEmployeeServiceData): Promise<Employee> {
  if (data.email) {
    const emailExistsResult = await employeeRepository.emailExists(data.email)

    if (emailExistsResult.isFailure()) {
      throw new Error(emailExistsResult.error)
    }

    if (emailExistsResult.getValue()) {
      throw new ConflictError('Employee email already exists')
    }
  }

  if (data.superiorId) {
    const superiorExistsResult = await employeeRepository.superiorExists(data.superiorId)

    if (superiorExistsResult.isFailure()) {
      throw new Error(superiorExistsResult.error)
    }

    if (!superiorExistsResult.getValue()) {
      throw new ValidationError('Superior employee not found')
    }
  }

  const result = await employeeRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const employee = result.getValue()

  // Auto-fill structural position (HEAD_OF_DIVISION → Division, MANAGER → Department)
  if (data.title) {
    await updateStructuralPosition(employee.employeeId, data.title, data.departmentId)
  }

  // Auto-create user account if employee has email
  if (data.email) {
    autoCreateUserForEmployee(employee, data.email, data.name)
  }

  return employee
}

function generateRandomPassword(): string {
  return randomBytes(6).toString('base64url').slice(0, 10)
}

async function resolveEmployeeRoleId(): Promise<number | undefined> {
  const roleResult = await roleRepository.findByName(DEFAULT_EMPLOYEE_ROLE_NAME)

  if (roleResult.isFailure()) return undefined

  const role = roleResult.getValue()
  return role?.roleId
}

function autoCreateUserForEmployee(employee: Employee, email: string, name: string): void {
  const plainPassword = generateRandomPassword()

  resolveEmployeeRoleId()
    .then((roleId) => {
      return userRestService.createUser({
        displayName: name,
        email,
        name,
        password: plainPassword,
        roleId,
        employeeId: employee.employeeId,
        superiorId: employee.employeeSuperiorId ?? undefined
      })
    })
    .catch((error) => {
      // Don't fail employee creation if user creation fails (e.g. email already exists)
      console.error(`[AUTO-USER] Failed to create user for employee ${employee.employeeId}:`, error instanceof Error ? error.message : error)
    })
}

export async function updateEmployee(id: number, data: UpdateEmployeeServiceData): Promise<Employee> {
  const existingResult = await employeeRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Employee not found')
  }

  if (data.email && data.email !== existing.employeeEmail) {
    const emailExistsResult = await employeeRepository.emailExistsExcept(data.email, id)

    if (emailExistsResult.isFailure()) {
      throw new Error(emailExistsResult.error)
    }

    if (emailExistsResult.getValue()) {
      throw new ConflictError('Employee email already exists')
    }
  }

  // Only validate superior if it's set and not 0 (0 means "No Superior")
  if (data.superiorId !== undefined && data.superiorId !== null && data.superiorId !== 0) {
    if (data.superiorId === id) {
      throw new ValidationError('Employee cannot be their own superior')
    }

    const superiorExistsResult = await employeeRepository.superiorExists(data.superiorId)

    if (superiorExistsResult.isFailure()) {
      throw new Error(superiorExistsResult.error)
    }

    if (!superiorExistsResult.getValue()) {
      throw new ValidationError('Superior employee not found')
    }
  }

  // If job title is changing, clear old structural positions first
  if (data.title !== undefined) {
    await clearStructuralPositions(id)
  }

  const result = await employeeRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const employee = result.getValue()

  // Auto-fill structural position (HEAD_OF_DIVISION → Division, MANAGER → Department)
  if (data.title) {
    await updateStructuralPosition(id, data.title, data.departmentId)
  }

  return employee
}

export async function deleteEmployee(id: number): Promise<void> {
  const existingResult = await employeeRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Employee not found')
  }

  const hasUsersResult = await employeeRepository.hasUsers(id)

  if (hasUsersResult.isFailure()) {
    throw new Error(hasUsersResult.error)
  }

  if (hasUsersResult.getValue()) {
    throw new ConflictError('Cannot delete employee with existing user accounts')
  }

  const result = await employeeRepository.softDelete(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}
