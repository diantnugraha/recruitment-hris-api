import type { Role, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type RoleFilters = {
  name?: string
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: Role[]
  total: number
}

export type CreateRoleData = {
  roleName: string
}

export type UpdateRoleData = {
  roleName: string
}

const roleSelectFields = {
  roleId: true,
  roleName: true
} as const

export async function findAll(
  filters: RoleFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.RoleWhereInput = {
      ...(filters.name && { roleName: { contains: filters.name } })
    }

    const [items, total] = await prisma.$transaction([
      prisma.role.findMany({
        where,
        select: roleSelectFields,
        orderBy: { roleName: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.role.count({ where })
    ])

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch roles'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<Role | null>> {
  try {
    const role = await prisma.role.findUnique({
      where: { roleId: id },
      select: roleSelectFields
    })
    return success(role)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find role by id'
    return failure(message)
  }
}

export async function create(data: CreateRoleData): Promise<RepositoryResult<Role>> {
  try {
    const role = await prisma.role.create({
      data: {
        roleName: data.roleName
      },
      select: roleSelectFields
    })
    return success(role)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create role'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateRoleData): Promise<RepositoryResult<Role>> {
  try {
    const role = await prisma.role.update({
      where: { roleId: id },
      data: {
        roleName: data.roleName
      },
      select: roleSelectFields
    })
    return success(role)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update role'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.role.delete({
      where: { roleId: id }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete role'
    return failure(message)
  }
}

export async function nameExists(name: string): Promise<RepositoryResult<boolean>> {
  try {
    const role = await prisma.role.findFirst({
      where: { roleName: name },
      select: { roleId: true }
    })
    return success(role !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function nameExistsExcept(name: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const role = await prisma.role.findFirst({
      where: {
        roleName: name,
        roleId: { not: exceptId }
      },
      select: { roleId: true }
    })
    return success(role !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name existence'
    return failure(message)
  }
}

export async function hasUsers(id: number): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.user.count({
      where: { roleId: id }
    })
    return success(count > 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check if role has users'
    return failure(message)
  }
}
