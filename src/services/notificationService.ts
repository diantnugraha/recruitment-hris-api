import * as notificationRepository from '../repositories/notificationRepository.js'

export async function getNotifications(
  userId: number,
  pagination: { page: number; limit: number },
  type?: string
) {
  const result = await notificationRepository.findByUserId(userId, pagination, type)
  if (result.isFailure()) throw new Error(result.error)
  return result.getValue()
}

export async function getUnreadCount(userId: number): Promise<number> {
  const result = await notificationRepository.getUnreadCount(userId)
  if (result.isFailure()) throw new Error(result.error)
  return result.getValue()
}

export async function markAsRead(id: number, userId: number): Promise<void> {
  const result = await notificationRepository.markAsRead(id, userId)
  if (result.isFailure()) throw new Error(result.error)
}

export async function markAllAsRead(userId: number): Promise<void> {
  const result = await notificationRepository.markAllAsRead(userId)
  if (result.isFailure()) throw new Error(result.error)
}

export async function createNotification(data: {
  userId: number
  type: string
  title: string
  message: string
  referenceType?: string
  referenceId?: bigint
}): Promise<void> {
  const result = await notificationRepository.create(data)
  if (result.isFailure()) throw new Error(result.error)
}

export async function hasNotificationForReference(
  referenceType: string,
  referenceId: bigint,
  type: string
): Promise<boolean> {
  const result = await notificationRepository.existsByReference(referenceType, referenceId, type)
  if (result.isFailure()) throw new Error(result.error)
  return result.getValue()
}
