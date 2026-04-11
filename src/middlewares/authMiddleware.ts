import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

import { JWT_CONFIG } from '../config/jwt.js'
import { UnauthorizedError } from '../errors/index.js'
import { AUTH_CONSTANTS } from '../constants/authConstants.js'
import { normalizeRoleName } from '../constants/roleConstants.js'
import * as userRepository from '../repositories/userRepository.js'

export interface JwtTokenPayload {
  userId: number
  email: string
}

export interface JwtPayload extends JwtTokenPayload {
  roleId: number
  roleName: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
  }
}

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization
  const cookieToken = request.cookies?.auth_token

  let token: string | undefined

  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== AUTH_CONSTANTS.TOKEN_PREFIX) {
      throw new UnauthorizedError('Invalid token format')
    }
    token = parts[1]
  } else if (cookieToken) {
    token = cookieToken
  }

  if (!token) {
    throw new UnauthorizedError('No token provided')
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as { userId: number; email: string }
    const userResult = await userRepository.findById(decoded.userId)
    if (userResult.isFailure()) {
      throw new UnauthorizedError('User not found')
    }
    const user = userResult.getValue()
    if (!user) {
      throw new UnauthorizedError('User not found')
    }
    const roleName = normalizeRoleName(user.role?.roleName ?? '')
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      roleId: user.roleId,
      roleName,
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error
    throw new UnauthorizedError('Invalid or expired token')
  }
}
