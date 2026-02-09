import type { FastifyRequest } from 'fastify'

import type { JwtPayload } from '../middlewares/authMiddleware.js'

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload
}
