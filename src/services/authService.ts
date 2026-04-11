import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { prisma } from '../config/database.js'
import { JWT_CONFIG } from '../config/jwt.js'
import { AUTH_CONSTANTS } from '../constants/authConstants.js'
import { normalizeRoleName } from '../constants/roleConstants.js'
import { AppError, ConflictError, UnauthorizedError } from '../errors/index.js'
import * as userRepository from '../repositories/userRepository.js'
import type { LoginBody, RegisterBody } from '../schemas/authSchemas.js'
import type { JwtTokenPayload } from '../middlewares/authMiddleware.js'

export interface ManagedDepartment {
  id: number
  name: string
}

export interface HeadOfDivision {
  id: number
  name: string
}

export interface AuthUser extends Omit<userRepository.UserWithoutPassword, never> {
  roleName: string
  managedDepartments: ManagedDepartment[]
  headOfDivisions: HeadOfDivision[]
}

export interface AuthResult {
  user: AuthUser
  token: string
}

export async function register(data: RegisterBody): Promise<AuthResult> {
  const emailExistsResult = await userRepository.emailExists(data.email)

  if (emailExistsResult.isFailure()) {
    throw new AppError(500, emailExistsResult.error)
  }

  if (emailExistsResult.getValue()) {
    throw new ConflictError('Email already exists')
  }

  const hashedPassword = await bcrypt.hash(data.password, AUTH_CONSTANTS.BCRYPT_ROUNDS)

  const createResult = await userRepository.create({
    email: data.email,
    password: hashedPassword,
    name: data.name
  })

  if (createResult.isFailure()) {
    throw new AppError(500, createResult.error)
  }

  const user = createResult.getValue()
  const token = generateToken({ userId: user.id, email: user.email })

  return { user, token }
}

export async function login(data: LoginBody): Promise<AuthResult> {
  const userResult = await userRepository.findByEmail(data.email)

  if (userResult.isFailure()) {
    throw new AppError(500, userResult.error)
  }

  const user = userResult.getValue()

  if (!user) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password)

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const token = generateToken({ userId: user.id, email: user.email })

  const { password: _, ...userWithoutPassword } = user

  const [role, employeeData] = await Promise.all([
    prisma.role.findUnique({ where: { roleId: user.roleId }, select: { roleName: true } }),
    user.employeeId
      ? prisma.employee.findUnique({
          where: { employeeId: user.employeeId },
          select: {
            managedDepartments: { select: { id: true, name: true } },
            headOfDivisions: { select: { id: true, name: true } },
          }
        })
      : null
  ])

  return {
    user: {
      ...userWithoutPassword,
      roleName: normalizeRoleName(role?.roleName ?? ''),
      managedDepartments: employeeData?.managedDepartments ?? [],
      headOfDivisions: employeeData?.headOfDivisions ?? [],
    },
    token
  }
}

export async function getCurrentUser(userId: number): Promise<AuthUser> {
  const userResult = await userRepository.findById(userId)

  if (userResult.isFailure()) {
    throw new AppError(500, userResult.error)
  }

  const user = userResult.getValue()

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  const [role, employeeData] = await Promise.all([
    prisma.role.findUnique({ where: { roleId: user.roleId }, select: { roleName: true } }),
    user.employeeId
      ? prisma.employee.findUnique({
          where: { employeeId: user.employeeId },
          select: {
            managedDepartments: { select: { id: true, name: true } },
            headOfDivisions: { select: { id: true, name: true } },
          }
        })
      : null
  ])

  return {
    ...user,
    roleName: normalizeRoleName(role?.roleName ?? ''),
    managedDepartments: employeeData?.managedDepartments ?? [],
    headOfDivisions: employeeData?.headOfDivisions ?? [],
  }
}

function generateToken(payload: JwtTokenPayload): string {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn
  })
}
