import { prisma } from '../config/database.js'
import { success, failure, type RepositoryResult } from './types.js'
import type { Notification, Prisma } from '@prisma/client'

export async function findByUserId(
  userId: number,
  pagination: { page: number; limit: number },
  type?: string
): Promise<RepositoryResult<{ items: Notification[]; total: number }>> {
  try {
    const where: Prisma.NotificationWhereInput = { userId }

    if (type) {
      const types = type.split(',').map(t => t.trim())
      where.type = { in: types }
    }

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.notification.count({ where }),
    ])

    return success({ items, total })
  } catch (error) {
    return failure(`Failed to fetch notifications: ${error}`)
  }
}

export async function getUnreadCount(userId: number): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    })
    return success(count)
  } catch (error) {
    return failure(`Failed to get unread count: ${error}`)
  }
}

export async function markAsRead(id: number, userId: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.notification.updateMany({
      where: { id: BigInt(id), userId },
      data: { isRead: true, updatedAt: new Date() },
    })
    return success(true)
  } catch (error) {
    return failure(`Failed to mark as read: ${error}`)
  }
}

export async function markAllAsRead(userId: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, updatedAt: new Date() },
    })
    return success(true)
  } catch (error) {
    return failure(`Failed to mark all as read: ${error}`)
  }
}

export async function create(data: {
  userId: number
  type: string
  title: string
  message: string
  referenceType?: string
  referenceId?: bigint
}): Promise<RepositoryResult<Notification>> {
  try {
    const notification = await prisma.notification.create({ data })
    return success(notification)
  } catch (error) {
    return failure(`Failed to create notification: ${error}`)
  }
}

export async function upsertByReference(data: {
  userId: number
  type: string
  title: string
  message: string
  referenceType: string
  referenceId: bigint
}): Promise<RepositoryResult<Notification>> {
  try {
    const notification = await prisma.notification.upsert({
      where: {
        referenceType_referenceId_type_userId: {
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          type: data.type,
          userId: data.userId,
        },
      },
      update: {
        title: data.title,
        message: data.message,
        isRead: false,
        updatedAt: new Date(),
      },
      create: data,
    })
    return success(notification)
  } catch (error) {
    return failure(`Failed to upsert notification: ${error}`)
  }
}

export async function existsByReference(
  referenceType: string,
  referenceId: bigint,
  type: string
): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.notification.count({
      where: { referenceType, referenceId, type },
    })
    return success(count > 0)
  } catch (error) {
    return failure(`Failed to check notification existence: ${error}`)
  }
}
