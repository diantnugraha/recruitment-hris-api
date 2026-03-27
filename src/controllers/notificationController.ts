import type { FastifyRequest, FastifyReply } from 'fastify'
import * as notificationService from '../services/notificationService.js'
import { sendSuccess, sendPaginated } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number; type?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, type } = request.query
  const enrichedUser = request.enrichedUser
  if (!enrichedUser) {
    throw new Error('Enriched user context is missing')
  }

  const userId = enrichedUser.userId
  const { items, total } = await notificationService.getNotifications(userId, { page, limit }, type)

  sendPaginated(reply, items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
}

export async function getUnreadCount(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const enrichedUser = request.enrichedUser
  if (!enrichedUser) {
    throw new Error('Enriched user context is missing')
  }

  const count = await notificationService.getUnreadCount(enrichedUser.userId)
  sendSuccess(reply, { count })
}

export async function markAsRead(
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply
): Promise<void> {
  const enrichedUser = request.enrichedUser
  if (!enrichedUser) {
    throw new Error('Enriched user context is missing')
  }

  const { id } = request.params
  await notificationService.markAsRead(id, enrichedUser.userId)
  sendSuccess(reply, null)
}

export async function markAllAsRead(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const enrichedUser = request.enrichedUser
  if (!enrichedUser) {
    throw new Error('Enriched user context is missing')
  }

  await notificationService.markAllAsRead(enrichedUser.userId)
  sendSuccess(reply, null)
}
