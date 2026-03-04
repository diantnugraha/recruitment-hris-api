import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

import { AppError } from '../errors/index.js'

interface ErrorWithStatus {
  status?: number
  statusCode?: number
  message?: string
  code?: string
  details?: string
}

export function errorHandler(
  error: FastifyError | Error | ErrorWithStatus,
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
  if ('validation' in error && (error as FastifyError).validation) {
    reply.status(400).send({
      success: false,
      message: error.message,
      code: 'VALIDATION_ERROR'
    })
    return
  }

  // Handle errors with status property (from external sources)
  const errWithStatus = error as ErrorWithStatus
  if (errWithStatus.status || errWithStatus.statusCode) {
    const status = errWithStatus.status || errWithStatus.statusCode || 500
    reply.status(status).send({
      success: false,
      message: errWithStatus.message || 'An error occurred',
      code: errWithStatus.code || (status === 401 ? 'UNAUTHORIZED' : 'ERROR')
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
