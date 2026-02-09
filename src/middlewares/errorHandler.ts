import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

import { AppError } from '../errors/index.js'

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      code: error.code
    })
    return
  }

  // Handle Fastify validation errors
  if ('validation' in error && error.validation) {
    reply.status(400).send({
      success: false,
      message: error.message,
      code: 'VALIDATION_ERROR'
    })
    return
  }

  request.log.error({ err: error }, 'Unhandled error')

  reply.status(500).send({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  })
}
