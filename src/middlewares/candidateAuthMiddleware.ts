import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

import { JWT_CONFIG } from '../config/jwt.js'
import { UnauthorizedError } from '../errors/index.js'
import { AUTH_CONSTANTS } from '../constants/authConstants.js'

export interface CandidateJwtPayload {
  candidateId: number
  email: string
  type: 'candidate'
}

declare module 'fastify' {
  interface FastifyRequest {
    candidate?: CandidateJwtPayload
  }
}

export async function authenticateCandidate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    throw new UnauthorizedError('No token provided')
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2 || parts[0] !== AUTH_CONSTANTS.TOKEN_PREFIX) {
    throw new UnauthorizedError('Invalid token format')
  }

  const token = parts[1]

  if (!token) {
    throw new UnauthorizedError('No token provided')
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as CandidateJwtPayload

    // Verify this is a candidate token
    if (decoded.type !== 'candidate') {
      throw new UnauthorizedError('Invalid token type')
    }

    request.candidate = decoded
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
