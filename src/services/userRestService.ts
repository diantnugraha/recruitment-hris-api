import bcrypt from 'bcryptjs'

import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js'
import * as userRestRepository from '../repositories/userRestRepository.js'
import type {
  CreateUserRestData,
  UpdateUserRestData,
  UserWithoutPassword,
  UserFilters,
  PaginationParams
} from '../repositories/userRestRepository.js'
import { emailExists } from '../repositories/userRepository.js'
import * as emailService from './emailService.js'

export type CreateUserServiceData = {
  displayName: string
  email: string
  name?: string
  password?: string
  roleId?: number
  employeeId?: number
  superiorId?: number
}

export type UpdateUserServiceData = {
  displayName: string
  email: string
  name?: string
  newPassword?: string
  roleId?: number
  employeeId?: number
  superiorId?: number
}

export type UpdatePasswordServiceData = {
  currentPassword: string
  newPassword: string
}

export type PaginatedUsers = {
  users: UserWithoutPassword[]
  total: number
}

export async function getAllUsers(
  filters: UserFilters,
  pagination: PaginationParams
): Promise<PaginatedUsers> {
  const result = await userRestRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getUserById(id: number): Promise<UserWithoutPassword> {
  const result = await userRestRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const user = result.getValue()
  if (!user) {
    throw new NotFoundError('User not found')
  }

  return user
}

export async function createUser(data: CreateUserServiceData): Promise<UserWithoutPassword> {
  const emailExistsResult = await emailExists(data.email)

  if (emailExistsResult.isFailure()) {
    throw new Error(emailExistsResult.error)
  }

  if (emailExistsResult.getValue()) {
    throw new ConflictError('Email already exists')
  }

  let hashedPassword = ''
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 10)
  }

  const createData: CreateUserRestData = {
    displayName: data.displayName,
    email: data.email,
    name: data.name,
    password: hashedPassword,
    roleId: data.roleId,
    employeeId: data.employeeId,
    superiorId: data.superiorId
  }

  const result = await userRestRepository.create(createData)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const user = result.getValue()

  emailService
    .sendWelcomeEmail({
      email: user.email,
      displayName: user.displayName
    })
    .catch((error) => {
      console.error('Failed to send welcome email:', error)
    })

  return user
}

export async function updateUser(id: number, data: UpdateUserServiceData): Promise<UserWithoutPassword> {
  const existingUserResult = await userRestRepository.findById(id)

  if (existingUserResult.isFailure()) {
    throw new Error(existingUserResult.error)
  }

  const existingUser = existingUserResult.getValue()
  if (!existingUser) {
    throw new NotFoundError('User not found')
  }

  if (data.email !== existingUser.email) {
    const emailExistsResult = await userRestRepository.emailExistsExcept(data.email, id)

    if (emailExistsResult.isFailure()) {
      throw new Error(emailExistsResult.error)
    }

    if (emailExistsResult.getValue()) {
      throw new ConflictError('Email already exists')
    }
  }

  const updateData: UpdateUserRestData = {
    displayName: data.displayName,
    email: data.email,
    name: data.name,
    roleId: data.roleId,
    employeeId: data.employeeId,
    superiorId: data.superiorId
  }

  const result = await userRestRepository.update(id, updateData)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const updatedUser = result.getValue()

  if (data.newPassword) {
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)
    const passwordResult = await userRestRepository.updatePassword(id, hashedPassword)

    if (passwordResult.isFailure()) {
      throw new Error(passwordResult.error)
    }

    return passwordResult.getValue()
  }

  return updatedUser
}

export async function updateUserPassword(id: number, data: UpdatePasswordServiceData): Promise<UserWithoutPassword> {
  const userResult = await userRestRepository.findByIdWithPassword(id)

  if (userResult.isFailure()) {
    throw new Error(userResult.error)
  }

  const user = userResult.getValue()
  if (!user) {
    throw new NotFoundError('User not found')
  }

  const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password)
  if (!isPasswordValid) {
    throw new ValidationError('Current password is incorrect')
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10)
  const result = await userRestRepository.updatePassword(id, hashedPassword)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteUser(id: number): Promise<void> {
  const existingUserResult = await userRestRepository.findById(id)

  if (existingUserResult.isFailure()) {
    throw new Error(existingUserResult.error)
  }

  const existingUser = existingUserResult.getValue()
  if (!existingUser) {
    throw new NotFoundError('User not found')
  }

  const result = await userRestRepository.softDelete(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}
