import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../errors/index.js'
import * as employeeRequestRepository from '../repositories/employeeRequestRepository.js'
import { STATUS_MAP, STATUS_REVERSE_MAP } from '../repositories/employeeRequestRepository.js'
import type {
  EmployeeRequestFilters,
  PaginationParams,
  EmployeeRequestWithRelations,
  RoleFilter
} from '../repositories/employeeRequestRepository.js'
import type { EnrichedUser } from '../middlewares/enrichUserContext.js'
import {
  EMPLOYEE_REQUEST_STATUS,
  WORKFLOW_TRANSITIONS,
  ER_NOTIFICATION_TYPE,
  ER_NOTIFICATION_CONFIG,
  type EmployeeRequestStatus,
  type ErNotificationType
} from '../constants/employeeRequestConstants.js'
import { prisma } from '../config/database.js'
import { getRestBudget } from './employeeBudgetService.js'
import * as notificationRepository from '../repositories/notificationRepository.js'
import { sendEmployeeRequestStatusEmail } from './emailService.js'

export type CreateEmployeeRequestServiceData = {
  jobTitleId: number
  reason: string
  purpose: string
  generalJobPurpose?: string
  jobDescription?: string
  jobRequirement?: string
  education: string
  experience: string
  genderPreference: string
  ageMin?: number
  ageMax?: number
  jobPlacement?: string
  budget?: string
  expectedOnboardDate?: Date
  status?: string
  createdBy: number
}

export type UpdateEmployeeRequestServiceData = {
  jobTitleId?: number
  reason?: string
  purpose?: string
  generalJobPurpose?: string
  jobDescription?: string
  jobRequirement?: string
  education?: string
  experience?: string
  genderPreference?: string
  ageMin?: number
  ageMax?: number
  jobPlacement?: string
  budget?: string
  expectedOnboardDate?: Date
}

export type PaginatedEmployeeRequests = {
  items: EmployeeRequestWithRelations[]
  total: number
}

// Helper to get string status from integer
function getStatusString(statusInt: number): EmployeeRequestStatus {
  return (STATUS_MAP[statusInt] || 'draft') as EmployeeRequestStatus
}

// Resolve job title type and department for budget validation
async function resolveJobTitleBudgetInfo(jobTitleId: number): Promise<{
  type: 'Technical' | 'Administration' | null
  departmentId: number | null
}> {
  const jobTitle = await prisma.jobTitle.findUnique({
    where: { id: BigInt(jobTitleId) },
    select: { type: true }
  })

  const pivot = await prisma.departmentJobTitle.findFirst({
    where: { jobTitleId: BigInt(jobTitleId) },
    select: { departmentId: true }
  })

  return {
    type: jobTitle?.type ?? null,
    departmentId: pivot?.departmentId ?? null
  }
}

// Validate employee budget before submitting request
async function validateBudgetForRequest(jobTitleId: number): Promise<void> {
  const { type, departmentId } = await resolveJobTitleBudgetInfo(jobTitleId)

  if (!type) {
    throw new ValidationError('Job title does not have a category (Technical/Administration). Please update the job title first.')
  }
  if (!departmentId) {
    throw new ValidationError('Job title is not assigned to any department.')
  }

  const restBudgetData = await getRestBudget(departmentId)
  const budgetCategory = type === 'Technical' ? 'technical' : 'admin'
  const available = restBudgetData.rest[budgetCategory]

  if (available <= 0) {
    const label = type === 'Technical' ? 'Technical' : 'Administration'
    throw new ValidationError(
      `Insufficient ${label} budget for this department. Available: ${available}. Please check the employee budget allocation.`
    )
  }
}

// --- Notification helpers ---

type NotificationTarget = { userId: number; email: string; name: string }

function getNotificationType(targetStatus: EmployeeRequestStatus): ErNotificationType | null {
  switch (targetStatus) {
    case EMPLOYEE_REQUEST_STATUS.CREATED:
      return ER_NOTIFICATION_TYPE.SUBMITTED
    case EMPLOYEE_REQUEST_STATUS.HOD_REVIEWED:
      return ER_NOTIFICATION_TYPE.HOD_APPROVED
    case EMPLOYEE_REQUEST_STATUS.REVIEWED:
      return ER_NOTIFICATION_TYPE.HR_APPROVED
    case EMPLOYEE_REQUEST_STATUS.APPROVED:
      return ER_NOTIFICATION_TYPE.APPROVED
    case EMPLOYEE_REQUEST_STATUS.REVISE:
      return ER_NOTIFICATION_TYPE.REVISED
    case EMPLOYEE_REQUEST_STATUS.REJECTED:
      return ER_NOTIFICATION_TYPE.REJECTED
    default:
      return null
  }
}

async function resolveNotificationTargets(
  request: EmployeeRequestWithRelations,
  targetStatus: EmployeeRequestStatus
): Promise<NotificationTarget[]> {
  const userSelect = { id: true, email: true, displayName: true }

  switch (targetStatus) {
    case EMPLOYEE_REQUEST_STATUS.CREATED: {
      // Notify HOD of the request's division (structural lookup)
      if (!request.departmentId) return []
      const dept = await prisma.department.findUnique({
        where: { id: request.departmentId },
        select: { divisionId: true },
      })
      if (!dept) return []
      const division = await prisma.division.findUnique({
        where: { id: dept.divisionId },
        select: { headOfDivisionId: true },
      })
      if (!division?.headOfDivisionId) return []
      const user = await prisma.user.findFirst({
        where: { employeeId: division.headOfDivisionId, trash: null },
        select: userSelect,
      })
      return user ? [{ userId: user.id, email: user.email, name: user.displayName }] : []
    }

    case EMPLOYEE_REQUEST_STATUS.HOD_REVIEWED: {
      // Notify HR Manager users only
      const hrUsers = await prisma.user.findMany({
        where: { role: { roleName: 'HR Manager' }, trash: null },
        select: userSelect,
      })
      return hrUsers.map(u => ({ userId: u.id, email: u.email, name: u.displayName }))
    }

    case EMPLOYEE_REQUEST_STATUS.REVIEWED: {
      // Notify all Management users
      const mgmtUsers = await prisma.user.findMany({
        where: { role: { roleName: 'Management' }, trash: null },
        select: userSelect,
      })
      return mgmtUsers.map(u => ({ userId: u.id, email: u.email, name: u.displayName }))
    }

    case EMPLOYEE_REQUEST_STATUS.APPROVED: {
      // Notify HR Manager + requester
      const hrUsers = await prisma.user.findMany({
        where: { role: { roleName: 'HR Manager' }, trash: null },
        select: userSelect,
      })
      const requester = await prisma.user.findFirst({
        where: { id: request.createdBy, trash: null },
        select: userSelect,
      })
      const targets: NotificationTarget[] = hrUsers.map(u => ({ userId: u.id, email: u.email, name: u.displayName }))
      if (requester && !targets.some(t => t.userId === requester.id)) {
        targets.push({ userId: requester.id, email: requester.email, name: requester.displayName })
      }
      return targets
    }

    case EMPLOYEE_REQUEST_STATUS.REVISE:
    case EMPLOYEE_REQUEST_STATUS.REJECTED: {
      // Notify requester only
      const requester = await prisma.user.findFirst({
        where: { id: request.createdBy, trash: null },
        select: userSelect,
      })
      return requester ? [{ userId: requester.id, email: requester.email, name: requester.displayName }] : []
    }

    default:
      return []
  }
}

async function sendStatusNotifications(
  request: EmployeeRequestWithRelations,
  targetStatus: EmployeeRequestStatus,
  actorName: string,
  comment?: string
): Promise<void> {
  const notificationType = getNotificationType(targetStatus)
  if (!notificationType) return

  const config = ER_NOTIFICATION_CONFIG[notificationType]
  const targets = await resolveNotificationTargets(request, targetStatus)
  if (targets.length === 0) return

  const requestCode = request.code
  const jobTitle = request.jobTitle?.name || 'Unknown Position'
  const department = request.department?.name || 'Unknown Department'
  const frontendUrl = process.env.FRONTEND_URL || ''
  const detailUrl = `${frontendUrl}/employee-request/${request.id}`

  const title = `Employee Request ${requestCode} - ${config.label}`
  const message = `Request ${requestCode} for ${jobTitle} has been ${config.label} by ${actorName}`

  // Create notifications and send emails in parallel
  const promises = targets.flatMap(target => [
    notificationRepository.upsertByReference({
      userId: target.userId,
      type: notificationType,
      title,
      message,
      referenceType: 'employee_request',
      referenceId: request.id,
    }).catch(err => console.error(`[NOTIFICATION] Failed to create notification for user ${target.userId}:`, err)),

    sendEmployeeRequestStatusEmail({
      recipientEmail: target.email,
      recipientName: target.name,
      requestCode,
      jobTitle,
      department,
      actionLabel: config.label,
      actorName,
      comment,
      statusColor: config.color,
      detailUrl,
    }).catch(err => console.error(`[EMAIL] Failed to send status email to ${target.email}:`, err)),
  ])

  await Promise.allSettled(promises)
}

export async function getAllEmployeeRequests(
  filters: EmployeeRequestFilters,
  pagination: PaginationParams,
  roleFilter?: RoleFilter
): Promise<PaginatedEmployeeRequests> {
  const result = await employeeRequestRepository.findAll(filters, pagination, roleFilter)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getEmployeeRequestById(id: number): Promise<EmployeeRequestWithRelations> {
  const result = await employeeRequestRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const employeeRequest = result.getValue()
  if (!employeeRequest) {
    throw new NotFoundError('Employee request not found')
  }

  return employeeRequest
}

export async function createEmployeeRequest(data: CreateEmployeeRequestServiceData): Promise<EmployeeRequestWithRelations> {
  // Validate budget when submitting (not when saving as draft)
  if (data.status === 'created') {
    await validateBudgetForRequest(data.jobTitleId)
  }

  const result = await employeeRequestRepository.create(data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const employeeRequest = result.getValue()

  // Add initial comment (simplified - no action/status tracking in DB)
  const commentText = data.status === 'created' ? 'Request submitted' : 'Request saved as draft'
  await employeeRequestRepository.addComment(Number(employeeRequest.id), {
    userId: data.createdBy,
    comment: commentText
  })

  // Trigger notification if created directly as 'created' (submitted on create)
  if (data.status === 'created') {
    try {
      const createdByUser = await prisma.user.findFirst({
        where: { id: data.createdBy },
        select: { displayName: true },
      })
      await sendStatusNotifications(
        employeeRequest,
        EMPLOYEE_REQUEST_STATUS.CREATED,
        createdByUser?.displayName || 'System'
      )
    } catch (err) {
      console.error('[NOTIFICATION] Failed to send notifications on create:', err)
    }
  }

  return employeeRequest
}

export async function updateEmployeeRequest(
  id: number,
  data: UpdateEmployeeRequestServiceData
): Promise<EmployeeRequestWithRelations> {
  // Check if employee request exists
  const existingResult = await employeeRequestRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Employee request not found')
  }

  // Get current status as string
  const currentStatus = getStatusString(existing.statusEmployeeRequest)

  // Only allow updates on draft or revise status
  if (currentStatus !== EMPLOYEE_REQUEST_STATUS.DRAFT && currentStatus !== EMPLOYEE_REQUEST_STATUS.REVISE) {
    throw new ConflictError('Can only update requests in draft or revise status')
  }

  const result = await employeeRequestRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

async function authorizeStatusTransition(
  user: EnrichedUser,
  currentStatus: EmployeeRequestStatus,
  _targetStatus: EmployeeRequestStatus,
  employeeRequest: { departmentId?: number | null; createdBy: number }
): Promise<void> {
  const { roleName, managedDepartmentIds, headOfDivisionIds, employeeId } = user

  // Admin can do everything
  if (roleName === 'admin') return

  const currentTransition = WORKFLOW_TRANSITIONS[currentStatus]
  if (!currentTransition) {
    throw new ForbiddenError('Invalid status transition')
  }

  const allowedRoles = currentTransition.allowedRoles

  // Check Manager role (structural — based on department)
  if (allowedRoles.includes('manager')) {
    if (!employeeId) {
      throw new ForbiddenError('User account is not linked to an employee record')
    }
    const deptId = employeeRequest.departmentId
    if (deptId && managedDepartmentIds.includes(deptId)) return
  }

  // Check HOD role (structural — based on division)
  if (allowedRoles.includes('hod')) {
    if (!employeeId) {
      throw new ForbiddenError('User account is not linked to an employee record')
    }
    const deptId = employeeRequest.departmentId
    if (deptId) {
      const dept = await prisma.department.findUnique({
        where: { id: deptId },
        select: { divisionId: true },
      })
      if (dept && headOfDivisionIds.includes(dept.divisionId)) return
    }
  }

  // Check role-based roles (HR, Management)
  if (allowedRoles.includes(roleName)) return

  throw new ForbiddenError('You do not have permission to perform this action')
}

export async function updateEmployeeRequestStatus(
  id: number,
  newStatus: string,
  user: EnrichedUser,
  comment?: string
): Promise<EmployeeRequestWithRelations> {
  // Check if employee request exists
  const existingResult = await employeeRequestRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Employee request not found')
  }

  // Get current status as string
  const currentStatus = getStatusString(existing.statusEmployeeRequest)
  const targetStatus = newStatus as EmployeeRequestStatus

  // Validate workflow transition
  const transition = WORKFLOW_TRANSITIONS[currentStatus]
  if (!transition || !transition.nextStatuses.includes(targetStatus)) {
    throw new ConflictError(`Cannot transition from ${currentStatus} to ${targetStatus}`)
  }

  // Authorize the user for this transition
  await authorizeStatusTransition(user, currentStatus, targetStatus, existing)

  // Re-validate budget when submitting (draft/revise → created)
  if (targetStatus === EMPLOYEE_REQUEST_STATUS.CREATED) {
    await validateBudgetForRequest(existing.jobTitleId)
  }

  // Build audit trail data
  const auditData: Record<string, unknown> = {}
  const now = new Date()

  if (targetStatus === EMPLOYEE_REQUEST_STATUS.HOD_REVIEWED) {
    auditData.hodReviewedBy = user.userId
    auditData.hodReviewedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.REVIEWED) {
    auditData.hrReviewedBy = user.userId
    auditData.hrReviewedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.APPROVED) {
    auditData.approvedBy = user.userId
    auditData.approvedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.REVISE) {
    auditData.revisedBy = user.userId
    auditData.revisedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.REJECTED) {
    auditData.rejectedBy = user.userId
    auditData.rejectedAt = now
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.CREATED && currentStatus === EMPLOYEE_REQUEST_STATUS.REVISE) {
    // Resubmit — reset all audit columns
    auditData.hodReviewedBy = null
    auditData.hodReviewedAt = null
    auditData.hrReviewedBy = null
    auditData.hrReviewedAt = null
    auditData.approvedBy = null
    auditData.approvedAt = null
    auditData.revisedBy = null
    auditData.revisedAt = null
  }

  // Prepare update data
  const updateData = {
    statusEmployeeRequest: STATUS_REVERSE_MAP[targetStatus] ?? 0,
    ...auditData,
  } as Record<string, unknown>

  // Generate recruitment code when starting recruitment
  if (targetStatus === EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT) {
    updateData.codeRecruitment = await employeeRequestRepository.generateRecruitmentCode()
    updateData.recruitmentStartedAt = new Date()
  }

  const result = await employeeRequestRepository.update(id, updateData)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  // Add comment for status change
  const commentText = comment || `Status changed from ${currentStatus} to ${newStatus}`
  await employeeRequestRepository.addComment(id, {
    userId: user.userId,
    comment: commentText
  })

  const updatedRequest = result.getValue()

  // Trigger notifications for status change
  try {
    const actor = await prisma.user.findFirst({
      where: { id: user.userId },
      select: { displayName: true },
    })
    await sendStatusNotifications(updatedRequest, targetStatus, actor?.displayName || 'System', comment)
  } catch (err) {
    console.error('[NOTIFICATION] Failed to send notifications on status change:', err)
  }

  return updatedRequest
}

export async function addComment(
  id: number,
  userId: number,
  comment: string
): Promise<{
  id: bigint
  employeeRequestId: bigint
  comment: string
  userId: number
  createdAt: Date | null
  updatedAt: Date | null
  user?: { id: number; name: string | null; displayName: string; role?: { roleName: string | null } | null } | null
}> {
  // Check if employee request exists
  const existingResult = await employeeRequestRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Employee request not found')
  }

  const result = await employeeRequestRepository.addComment(id, {
    userId,
    comment
  })

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteEmployeeRequest(id: number): Promise<void> {
  const existingResult = await employeeRequestRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Employee request not found')
  }

  // Get current status as string
  const currentStatus = getStatusString(existing.statusEmployeeRequest)

  // Only allow deletion of draft requests
  if (currentStatus !== EMPLOYEE_REQUEST_STATUS.DRAFT) {
    throw new ConflictError('Can only delete requests in draft status')
  }

  const result = await employeeRequestRepository.softDelete(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

export async function getStats(roleFilter?: RoleFilter): Promise<Record<string, number>> {
  const result = await employeeRequestRepository.getStats(roleFilter)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function startRecruitment(id: number, user: EnrichedUser): Promise<EmployeeRequestWithRelations> {
  // Check if employee request exists and is approved
  const existingResult = await employeeRequestRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Employee request not found')
  }

  // Get current status as string
  const currentStatus = getStatusString(existing.statusEmployeeRequest)

  if (currentStatus !== EMPLOYEE_REQUEST_STATUS.APPROVED) {
    throw new ConflictError('Can only start recruitment for approved requests')
  }

  return updateEmployeeRequestStatus(
    id,
    EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT,
    user,
    'Recruitment process started'
  )
}
