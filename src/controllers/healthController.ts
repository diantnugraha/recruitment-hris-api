import type { FastifyRequest, FastifyReply } from 'fastify'

import { getHealthStatus } from '../services/healthService.js'

export async function checkHealth(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const health = await getHealthStatus()
  const statusCode = health.status === 'ok' ? 200 : 503

  reply.status(statusCode).send({
    success: true,
    data: health
  })
}
