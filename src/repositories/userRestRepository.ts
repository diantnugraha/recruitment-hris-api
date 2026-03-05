import type { User, Role, Employee, UserFile } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type UserWithRelations = User & {
  role: Role
  employee: Employee | null
  files: UserFile[]
}

export type UserWithoutPassword = Omit<UserWithRelations, 'password' | 'trash' | 'rememberToken' | 'userImei'>

export type CreateUserRestData = {
  displayName: string
  email: string
  name?: string
  password?: string
  roleId?: number
  employeeId?: number
  superiorId?: number
}

export type UpdateUserRestData = {
  displayName: string
  email: string
  name?: string
  roleId?: number
  employeeId?: number
  superiorId?: number
}

export type UserFilters = {
  id?: number
  display_name?: string
  email?: string
}

export type PaginationParams = {
  page: number
  limit: number
  orderBy?: 'name' | 'email' | 'displayName'
  direction?: 'asc' | 'desc'
}

export type PaginatedResult = {
  users: UserWithoutPassword[]
  total: number
}

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  displayName: true,
  roleId: true,
  employeeId: true,
  superiorId: true,
  // emailVerifiedAt: true, // temporarily disabled to test
  created_at: true,
  updated_at: true,
  role: {
    select: {
      roleId: true,
      roleName: true
    }
  },
  employee: {
    select: {
      employeeId: true,
      employeeName: true,
      employeeEmail: true,
      employeeTitle: true,
      employeeStatus: true
    }
  },
  files: {
    select: {
      id: true,
      name: true,
      type: true,
      location: true
    }
  }
} as const

export async function findAll(
  filters: UserFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.UserWhereInput = {
      trash: null,
      ...(filters.id && { id: filters.id }),
      ...(filters.display_name && {
        displayName: { contains: filters.display_name }
      }),
      ...(filters.email && {
        email: { contains: filters.email }
      })
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [pagination.orderBy || 'name']: pagination.direction || 'asc'
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: userSelectFields,
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.user.count({ where })
    ])

    return success({ users, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<UserWithoutPassword | null>> {
  try {
    const user = await prisma.user.findFirst({
      where: { id, trash: null },
      select: userSelectFields
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find user by id'
    return failure(message)
  }
}

export async function create(data: CreateUserRestData): Promise<RepositoryResult<UserWithoutPassword>> {
  try {
    const user = await prisma.user.create({
      data: {
        displayName: data.displayName,
        email: data.email,
        name: data.name,
        password: data.password || '',
        roleId: data.roleId || 1,
        employeeId: data.employeeId,
        superiorId: data.superiorId
      },
      select: userSelectFields
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateUserRestData): Promise<RepositoryResult<UserWithoutPassword>> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        displayName: data.displayName,
        email: data.email,
        name: data.name,
        roleId: data.roleId,
        employeeId: data.employeeId,
        superiorId: data.superiorId
      },
      select: userSelectFields
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    return failure(message)
  }
}

export async function updatePassword(id: number, hashedPassword: string): Promise<RepositoryResult<UserWithoutPassword>> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: userSelectFields
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update password'
    return failure(message)
  }
}

export async function softDelete(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.user.update({
      where: { id },
      data: { trash: new Date() }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    return failure(message)
  }
}

export async function emailExistsExcept(email: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        trash: null,
        id: { not: exceptId }
      },
      select: { id: true }
    })
    return success(user !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check email existence'
    return failure(message)
  }
}

export async function findByIdWithPassword(id: number): Promise<RepositoryResult<User | null>> {
  try {
    const user = await prisma.user.findFirst({
      where: { id, trash: null }
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find user'
    return failure(message)
  }
}
