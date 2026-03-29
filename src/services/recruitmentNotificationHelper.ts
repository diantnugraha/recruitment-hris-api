import * as notificationRepository from '../repositories/notificationRepository.js'
import {
  RECRUITMENT_NOTIFICATION_TYPE,
  type RecruitmentNotificationType,
} from '../constants/recruitmentNotificationConstants.js'

type NotificationParams = {
  type: RecruitmentNotificationType
  candidateId: number
  candidateName: string
  targetUserIds: number[]
  extra?: string
}

function buildNotificationContent(params: NotificationParams): { title: string; message: string } {
  const { type, candidateName, extra } = params

  switch (type) {
    case RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED:
      return {
        title: 'Biodata Submitted',
        message: `${candidateName} has submitted their biodata and is ready for review`,
      }
    case RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED:
      return {
        title: 'Assessment Assignment',
        message: `You have been assigned to assess candidate ${candidateName} for Interview User`,
      }
    case RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED:
      return {
        title: `Interview User ${extra || 'Completed'}`,
        message: `Candidate ${candidateName} has ${extra?.toLowerCase() || 'completed'} the Interview User assessment`,
      }
    case RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED:
      return {
        title: 'Onboarding Accepted',
        message: `Candidate ${candidateName} has accepted the onboarding offer`,
      }
  }
}

export async function sendRecruitmentNotification(params: NotificationParams): Promise<void> {
  const { type, candidateId, targetUserIds } = params

  if (targetUserIds.length === 0) return

  const { title, message } = buildNotificationContent(params)

  for (const userId of targetUserIds) {
    const result = await notificationRepository.upsertByReference({
      userId,
      type,
      title,
      message,
      referenceType: 'candidate',
      referenceId: BigInt(candidateId),
    })
    if (result.isFailure()) {
      console.error(`[NOTIFICATION] Failed to create recruitment notification for user ${userId}:`, result.getError())
    }
  }
}
