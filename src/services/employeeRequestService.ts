import { NotFoundError, ConflictError } from '../errors/index.js'
import * as employeeRequestRepository from '../repositories/employeeRequestRepository.js'
import { STATUS_MAP, STATUS_REVERSE_MAP } from '../repositories/employeeRequestRepository.js'
import type {
  EmployeeRequestFilters,
  PaginationParams,
  EmployeeRequestWithRelations
} from '../repositories/employeeRequestRepository.js'
import {
  EMPLOYEE_REQUEST_STATUS,
  WORKFLOW_TRANSITIONS,
  type EmployeeRequestStatus
} from '../constants/employeeRequestConstants.js'

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

export async function getAllEmployeeRequests(
  filters: EmployeeRequestFilters,
  pagination: PaginationParams
): Promise<PaginatedEmployeeRequests> {
  const result = await employeeRequestRepository.findAll(filters, pagination)

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

export async function updateEmployeeRequestStatus(
  id: number,
  newStatus: string,
  userId: number,
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

  // Convert target status to integer for DB
  const statusInt = STATUS_REVERSE_MAP[targetStatus] ?? 0

  // Prepare update data
  const updateData: {
    statusEmployeeRequest: number
    codeRecruitment?: string
    reviewedAt?: Date
    approvedAt?: Date
  } = { statusEmployeeRequest: statusInt }

  // Generate recruitment code when starting recruitment
  if (targetStatus === EMPLOYEE_REQUEST_STATUS.IN_RECRUITMENT) {
    updateData.codeRecruitment = await employeeRequestRepository.generateRecruitmentCode()
  }

  // Set timestamp based on status
  if (targetStatus === EMPLOYEE_REQUEST_STATUS.REVIEWED) {
    updateData.reviewedAt = new Date()
  } else if (targetStatus === EMPLOYEE_REQUEST_STATUS.APPROVED) {
    updateData.approvedAt = new Date()
  }

  const result = await employeeRequestRepository.update(id, updateData)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  // Add comment for status change
  const commentText = comment || `Status changed from ${currentStatus} to ${newStatus}`
  await employeeRequestRepository.addComment(id, {
    userId,
    comment: commentText
  })

  return result.getValue()
}

export async function addComment(
  id: number,
  userId: number,
  comment: string
): Promise<{
  id: bigint
  employeeRequestId: number
  comment: string
  userId: number
  createdAt: Date | null
  updatedAt: Date | null
  user?: { id: number; name: string | null; displayName: string } | null
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

export async function getStats(): Promise<Record<string, number>> {
  const result = await employeeRequestRepository.getStats()

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function startRecruitment(id: number, userId: number): Promise<EmployeeRequestWithRelations> {
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
    userId,
    'Recruitment process started'
  )
}
