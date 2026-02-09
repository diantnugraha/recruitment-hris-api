import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { JWT_CONFIG } from '../config/jwt.js'
import { AUTH_CONSTANTS } from '../constants/authConstants.js'
import { AppError, ConflictError, UnauthorizedError } from '../errors/index.js'
import * as userRepository from '../repositories/userRepository.js'
import type { LoginBody, RegisterBody } from '../schemas/authSchemas.js'
import type { JwtPayload } from '../middlewares/authMiddleware.js'

export interface AuthResult {
  user: userRepository.UserWithoutPassword
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

  return { user: userWithoutPassword, token }
}

export async function getCurrentUser(userId: number): Promise<userRepository.UserWithoutPassword> {
  const userResult = await userRepository.findById(userId)

  if (userResult.isFailure()) {
    throw new AppError(500, userResult.error)
  }

  const user = userResult.getValue()

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  return user
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn
  })
}
