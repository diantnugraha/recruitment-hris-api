import type { Role } from '@prisma/client'

import { NotFoundError, ConflictError, BadRequestError } from '../errors/index.js'
import * as roleRepository from '../repositories/roleRepository.js'
import type { RoleFilters, PaginationParams } from '../repositories/roleRepository.js'

export type CreateRoleServiceData = {
  roleName: string
}

export type UpdateRoleServiceData = {
  roleName: string
}

export type PaginatedRoles = {
  items: Role[]
  total: number
}

export async function getAllRoles(
  filters: RoleFilters,
  pagination: PaginationParams
): Promise<PaginatedRoles> {
  const result = await roleRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getRoleById(id: number): Promise<Role> {
  const result = await roleRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const role = result.getValue()
  if (!role) {
    throw new NotFoundError('Role not found')
  }

  return role
}

export async function createRole(data: CreateRoleServiceData): Promise<Role> {
  await validateUniqueness(data.roleName)

  const result = await roleRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateRole(id: number, data: UpdateRoleServiceData): Promise<Role> {
  const existingResult = await roleRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Role not found')
  }

  await validateUniquenessOnUpdate(id, data.roleName, existing)

  const result = await roleRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteRole(id: number): Promise<void> {
  const existingResult = await roleRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Role not found')
  }

  const hasUsersResult = await roleRepository.hasUsers(id)
  if (hasUsersResult.isFailure()) {
    throw new Error(hasUsersResult.error)
  }

  if (hasUsersResult.getValue()) {
    throw new BadRequestError('Cannot delete role that has assigned users')
  }

  const result = await roleRepository.remove(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

async function validateUniqueness(name: string): Promise<void> {
  const nameExistsResult = await roleRepository.nameExists(name)

  if (nameExistsResult.isFailure()) {
    throw new Error(nameExistsResult.error)
  }

  if (nameExistsResult.getValue()) {
    throw new ConflictError('Role name already exists')
  }
}

async function validateUniquenessOnUpdate(
  id: number,
  name: string,
  existing: Role
): Promise<void> {
  if (name !== existing.roleName) {
    const nameExistsResult = await roleRepository.nameExistsExcept(name, id)

    if (nameExistsResult.isFailure()) {
      throw new Error(nameExistsResult.error)
    }

    if (nameExistsResult.getValue()) {
      throw new ConflictError('Role name already exists')
    }
  }
}
