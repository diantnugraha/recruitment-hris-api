import type { FastifyReply } from 'fastify'

import type { Pagination } from '../schemas/response.js'

interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: Pagination
}

interface ErrorResponse {
  success: false
  message: string
  code?: string
}

export function successResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message })
  }
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  reply.status(statusCode).send(successResponse(data, message))
}

export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  pagination: Pagination,
  statusCode: number = 200
): void {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination
  }
  reply.status(statusCode).send(response)
}

export function sendError(
  reply: FastifyReply,
  message: string,
  statusCode: number = 500,
  code?: string
): void {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(code && { code })
  }
  reply.status(statusCode).send(response)
}

export function calculatePagination(
  page: number,
  limit: number,
  total: number
): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}
