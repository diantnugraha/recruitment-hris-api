import type { User } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type CreateUserData = {
  email: string
  password: string
  name: string
  role?: string
}

export type UserWithoutPassword = Omit<User, 'password'>

export async function findByEmail(email: string): Promise<RepositoryResult<User | null>> {
  try {
    const user = await prisma.user.findFirst({
      where: { email, trash: null }
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find user by email'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<UserWithoutPassword | null>> {
  try {
    const user = await prisma.user.findFirst({
      where: { id, trash: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        trash: true
      }
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find user by id'
    return failure(message)
  }
}

export async function create(data: CreateUserData): Promise<RepositoryResult<UserWithoutPassword>> {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role ?? 'user'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        trash: true
      }
    })
    return success(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return failure(message)
  }
}

export async function emailExists(email: string): Promise<RepositoryResult<boolean>> {
  try {
    const user = await prisma.user.findFirst({
      where: { email, trash: null },
      select: { id: true }
    })
    return success(user !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check email existence'
    return failure(message)
  }
}
