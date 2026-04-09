import type { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError } from '../errors/index.js'

// HR_ROLE_IDS corresponds to frontend HR_ROLES:
// 1 = HUMAN_RESOURCES, 8 = HR_MANAGER, 3 = SUPER_ADMIN
const HR_ROLE_IDS = [1, 8, 3]

export async function requireHrRole(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!HR_ROLE_IDS.includes(request.user.roleId)) {
    throw new ForbiddenError('Only HR can perform this action')
  }
}
