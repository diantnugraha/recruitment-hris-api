import type { CandidateRecruitment, Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

import { NotFoundError, ConflictError, BadRequestError } from '../errors/index.js'
import { sendCandidateInvitationEmail, sendInterviewAssignmentEmail, sendInterviewScheduleEmail, sendMcuScheduleEmail, sendOnboardingEmail as sendOnboardingEmailToCandidate, sendCandidateRejectionEmail, sendFacilityPicEmail, sendProgramPicEmail, sendWelcomeEmail } from './emailService.js'
import * as candidateRepository from '../repositories/candidateRepository.js'
import * as candidateDetailRepository from '../repositories/candidateDetailRepository.js'
import * as candidateAssessmentRepository from '../repositories/candidateAssessmentRepository.js'
import * as onboardingRepository from '../repositories/onboardingRepository.js'
import * as onboardingConversionRepository from '../repositories/onboardingConversionRepository.js'
import * as employeeRepository from '../repositories/employeeRepository.js'
import * as employeeRequestRepository from '../repositories/employeeRequestRepository.js'
import * as roleRepository from '../repositories/roleRepository.js'
import { prisma } from '../config/database.js'
import { sendRecruitmentNotification } from './recruitmentNotificationHelper.js'
import { RECRUITMENT_NOTIFICATION_TYPE } from '../constants/recruitmentNotificationConstants.js'

const DEFAULT_EMPLOYEE_ROLE_NAME = 'Employee'
import type {
  CandidateFilters,
  PaginationParams,
  CandidateWithDetail
} from '../repositories/candidateRepository.js'
import type { AssessmentStatus, AssessmentProgress } from '../repositories/candidateAssessmentRepository.js'
import type { OnboardingWithRelations } from '../repositories/onboardingRepository.js'

// ==================== Type Definitions ====================

export type ScoringInput = {
  relevanceOfExperience: number
  trainingUndertaken: number
  technicalSkills: number
  nonTechnicalSkills: number
  communicationSkills: number
  emotionalMaturity: number
  understandingOfPosition: number
  teamworkAbility: number
}

export type InterviewScoringPayload = {
  scoring: ScoringInput
  conclusion: 'PROCEED' | 'RECOMMENDED' | 'REJECTED'
  keyCompetencies?: string | null | undefined
  interviewerNotes?: string | null | undefined
  assessedBy?: string | null | undefined
  assessorIds?: number[] | undefined
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent'
}

function formatScoringDescription(payload: InterviewScoringPayload): string {
  const { scoring, conclusion } = payload
  const entries = [
    ['Relevance of Experience', scoring.relevanceOfExperience],
    ['Training Undertaken', scoring.trainingUndertaken],
    ['Technical Skills', scoring.technicalSkills],
    ['Non-Technical Skills', scoring.nonTechnicalSkills],
    ['Communication Skills', scoring.communicationSkills],
    ['Emotional Maturity', scoring.emotionalMaturity],
    ['Understanding of Position', scoring.understandingOfPosition],
    ['Teamwork Ability', scoring.teamworkAbility],
  ] as const

  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const lines = entries.map(([label, val]) => `${label}: ${val}/5 (${SCORE_LABELS[val] ?? val})`)
  lines.push(`\nTotal Score: ${total}/40`)
  lines.push(`Conclusion: ${conclusion}`)

  return lines.join('\n')
}

function computeTotalScore(scoring: ScoringInput): number {
  return (
    scoring.relevanceOfExperience +
    scoring.trainingUndertaken +
    scoring.technicalSkills +
    scoring.nonTechnicalSkills +
    scoring.communicationSkills +
    scoring.emotionalMaturity +
    scoring.understandingOfPosition +
    scoring.teamworkAbility
  )
}

// ==================== Assessor Notification Helper ====================

type AssessorNotificationParams = {
  candidateId: number
  assessorIds: number[]
  interviewType: 'Interview User' | 'Interview HR'
}

async function sendAssessorNotifications(params: AssessorNotificationParams): Promise<void> {
  const { candidateId, assessorIds, interviewType } = params

  // Fetch candidate details
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    console.error(`[EMAIL] Failed to fetch candidate ${candidateId}:`, candidateResult.error)
    return
  }

  const candidate = candidateResult.getValue()
  if (!candidate) {
    console.error(`[EMAIL] Candidate ${candidateId} not found`)
    return
  }

  const candidateName = candidate.fullname
  const jobTitle = candidate.jobTitle?.name || 'Position'
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recruitment/${candidateId}`

  // Send email to each assessor
  for (const assessorId of assessorIds) {
    try {
      const employeeResult = await employeeRepository.findById(assessorId)
      if (employeeResult.isFailure()) {
        console.error(`[EMAIL] Failed to fetch employee ${assessorId}:`, employeeResult.error)
        continue
      }

      const employee = employeeResult.getValue()
      if (!employee) {
        console.error(`[EMAIL] Employee ${assessorId} not found`)
        continue
      }

      const assessorName = employee.employeeName || `Employee ${assessorId}`
      const assessorEmail = employee.employeeEmail

      if (!assessorEmail) {
        console.error(`[EMAIL] Employee ${assessorId} has no email`)
        continue
      }

      await sendInterviewAssignmentEmail({
        assessorEmail,
        assessorName,
        candidateName,
        jobTitle,
        interviewType,
        dashboardUrl,
      })

      console.log(`[EMAIL] Interview assignment sent to ${assessorEmail} for candidate ${candidateName}`)
    } catch (error) {
      console.error(`[EMAIL] Failed to send email to assessor ${assessorId}:`, error)
      // Continue with other assessors even if one fails
    }
  }
}

// ==================== Rejection Notification Helper ====================

type RejectionStage = 'HR Assessment' | 'User Assessment' | 'Medical Check-Up'

async function sendRejectionNotification(candidateId: number, stage: RejectionStage): Promise<void> {
  try {
    const candidateResult = await candidateRepository.findById(candidateId)
    if (candidateResult.isFailure()) {
      console.error(`[EMAIL] Failed to fetch candidate ${candidateId} for rejection email:`, candidateResult.error)
      return
    }

    const candidate = candidateResult.getValue()
    if (!candidate) {
      console.error(`[EMAIL] Candidate ${candidateId} not found for rejection email`)
      return
    }

    if (!candidate.email) {
      console.error(`[EMAIL] Candidate ${candidateId} has no email for rejection notification`)
      return
    }

    await sendCandidateRejectionEmail({
      candidateEmail: candidate.email,
      candidateName: candidate.fullname,
      jobTitle: candidate.jobTitle?.name || 'Position',
      stage,
    })

    console.log(`[EMAIL] Rejection email sent to ${candidate.email} at stage: ${stage}`)
  } catch (error) {
    console.error(`[EMAIL] Failed to send rejection email for candidate ${candidateId}:`, error)
  }
}

export type CreateCandidateServiceData = {
  fullname: string
  email: string
  address?: string
  residentStatus?: string
  birthPlace?: string
  birthDate?: Date
  religion?: string
  ethnicGroup?: string
  idNo?: string
  taxId?: string
  bpjsId?: string
  citizenship?: string
  marritalStatus?: string
  gender?: 'M' | 'F'
  mobilePhone?: string
  drivingLicense?: string
  // For linking to employee request
  employeeRequestId?: number
  jobTitleId?: number
}

export type UpdateCandidateServiceData = Partial<CreateCandidateServiceData>

export type PaginatedCandidates = {
  items: CandidateWithDetail[]
  total: number
}

// ==================== Candidate CRUD ====================

export async function getAllCandidates(
  filters: CandidateFilters,
  pagination: PaginationParams
): Promise<PaginatedCandidates> {
  const result = await candidateRepository.findAll(filters, pagination)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getCandidateById(id: number): Promise<CandidateWithDetail> {
  const result = await candidateRepository.findById(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const candidate = result.getValue()
  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  return candidate
}

export async function getCandidateByEmail(email: string): Promise<CandidateRecruitment | null> {
  const result = await candidateRepository.findByEmail(email)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getCandidateByToken(token: string): Promise<CandidateRecruitment | null> {
  const result = await candidateRepository.findByToken(token)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function getCandidatesByEmployeeRequest(
  employeeRequestId: number,
  pagination?: PaginationParams
): Promise<PaginatedCandidates> {
  const result = await candidateRepository.findByEmployeeRequestId(
    employeeRequestId,
    pagination || { page: 1, limit: 50 }
  )

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function createCandidate(data: CreateCandidateServiceData): Promise<CandidateWithDetail> {
  // Check if email already exists
  const emailExistsResult = await candidateRepository.emailExists(data.email)

  if (emailExistsResult.isFailure()) {
    throw new Error(emailExistsResult.error)
  }

  if (emailExistsResult.getValue()) {
    throw new ConflictError('Candidate with this email already exists')
  }

  // Create the main candidate record
  const createResult = await candidateRepository.create({
    email: data.email,
    fullname: data.fullname,
    address: data.address,
    residentStatus: data.residentStatus,
    birthPlace: data.birthPlace,
    birthDate: data.birthDate,
    religion: data.religion,
    ethnicGroup: data.ethnicGroup,
    idNo: data.idNo,
    taxId: data.taxId,
    bpjsId: data.bpjsId,
    citizenship: data.citizenship,
    marritalStatus: data.marritalStatus,
    gender: data.gender,
    mobilePhone: data.mobilePhone,
    drivingLicense: data.drivingLicense
  })

  if (createResult.isFailure()) {
    throw new Error(createResult.error)
  }

  const candidate = createResult.getValue()

  // If employee request and job title are provided, create the detail record
  if (data.employeeRequestId && data.jobTitleId) {
    const detailResult = await candidateDetailRepository.create({
      candidateId: Number(candidate.id),
      jobTitleId: data.jobTitleId,
      employeeRequestId: data.employeeRequestId
    })

    if (detailResult.isFailure()) {
      throw new Error(detailResult.error)
    }

    const detail = detailResult.getValue()

    // Create assessment record for this candidate
    const assessmentResult = await candidateAssessmentRepository.create({
      candidateId: Number(candidate.id),
      candidateRecruitmentDetailId: Number(detail.id)
    })

    if (assessmentResult.isFailure()) {
      throw new Error(assessmentResult.error)
    }
  }

  // Fetch the complete candidate with relations
  return getCandidateById(Number(candidate.id))
}

export async function updateCandidate(id: number, data: UpdateCandidateServiceData): Promise<CandidateWithDetail> {
  // Check if candidate exists
  const existingResult = await candidateRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Candidate not found')
  }

  // Check if email is being changed and if it already exists
  if (data.email && data.email !== existing.email) {
    const emailExistsResult = await candidateRepository.emailExistsExcept(data.email, id)

    if (emailExistsResult.isFailure()) {
      throw new Error(emailExistsResult.error)
    }

    if (emailExistsResult.getValue()) {
      throw new ConflictError('Candidate with this email already exists')
    }
  }

  const result = await candidateRepository.update(id, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return getCandidateById(id)
}

export async function deleteCandidate(id: number): Promise<void> {
  const existingResult = await candidateRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Candidate not found')
  }

  // Delete all related records first
  await candidateAssessmentRepository.removeByCandidateId(id)
  await candidateDetailRepository.removeByCandidateId(id)

  const result = await candidateRepository.remove(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

export async function generateCandidateToken(id: number): Promise<string> {
  const existingResult = await candidateRepository.findById(id)

  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Candidate not found')
  }

  const result = await candidateRepository.generateToken(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function verifyCandidate(id: number): Promise<void> {
  const result = await candidateRepository.verifyCandidate(id)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

export async function sendCandidateInvitation(
  candidateId: number,
  portalBaseUrl: string,
  userId: number
): Promise<{ success: boolean; message: string }> {
  // Get candidate with relations
  const candidate = await getCandidateById(candidateId)

  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  // Generate random 8-char password
  const plainPassword = generateRandomPassword()

  // Store password in candidate_recruitment_detail.candidate_token
  const setPasswordResult = await candidateDetailRepository.setPassword(candidateId, plainPassword)
  if (setPasswordResult.isFailure()) {
    throw new Error(setPasswordResult.error)
  }

  // Get job title and department info
  const jobTitleName = candidate.jobTitle?.name || 'Position'
  const departmentName = candidate.employeeRequest?.code
    ? `Request: ${candidate.employeeRequest.code}`
    : 'Department'

  // Construct portal URL (login page, no token in URL)
  const portalUrl = `${portalBaseUrl}/login`

  // Parse fullname into first and last name
  const nameParts = candidate.fullname.split(' ')
  const firstName = nameParts[0] || candidate.fullname
  const lastName = nameParts.slice(1).join(' ') || ''

  // Send email via Mailgun with credentials
  await sendCandidateInvitationEmail({
    email: candidate.email,
    firstName,
    lastName,
    jobTitle: jobTitleName,
    department: departmentName,
    portalUrl,
    password: plainPassword,
  })

  // Save which HR user sent the invitation
  const invitedByResult = await candidateDetailRepository.updateInvitedBy(candidateId, userId)
  if (invitedByResult.isFailure()) {
    console.error(`[NOTIFICATION] Failed to save invited_by for candidate ${candidateId}:`, invitedByResult.error)
  }

  return {
    success: true,
    message: `Invitation email sent to ${candidate.email}`
  }
}

// ==================== Link Candidate to Employee Request ====================

export async function linkToEmployeeRequest(
  candidateId: number,
  employeeRequestId: number,
  jobTitleId: number
): Promise<CandidateWithDetail> {
  // Check if candidate exists
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    throw new Error(candidateResult.error)
  }
  if (!candidateResult.getValue()) {
    throw new NotFoundError('Candidate not found')
  }

  // Check if already linked
  const existingDetailResult = await candidateDetailRepository.findByCandidateId(candidateId)
  if (existingDetailResult.isFailure()) {
    throw new Error(existingDetailResult.error)
  }

  if (existingDetailResult.getValue()) {
    throw new ConflictError('Candidate is already linked to an employee request')
  }

  // Create the detail record
  const detailResult = await candidateDetailRepository.create({
    candidateId,
    jobTitleId,
    employeeRequestId
  })

  if (detailResult.isFailure()) {
    throw new Error(detailResult.error)
  }

  const detail = detailResult.getValue()

  // Create assessment record
  const assessmentResult = await candidateAssessmentRepository.create({
    candidateId,
    candidateRecruitmentDetailId: Number(detail.id)
  })

  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  return getCandidateById(candidateId)
}

// ==================== Assessment Services ====================

export async function getAssessmentProgress(candidateId: number): Promise<AssessmentProgress | null> {
  const result = await candidateAssessmentRepository.getProgress(candidateId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function startAssessment(
  candidateId: number,
  interviewDate?: string,
  interviewType?: 'online' | 'onsite'
): Promise<AssessmentProgress> {
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    throw new Error(candidateResult.error)
  }

  const candidate = candidateResult.getValue()
  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  // Check if candidate is verified
  if (candidate.verify !== 'VERIFIED') {
    throw new BadRequestError('Candidate must be verified before starting assessment')
  }

  // Check if assessment record exists
  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)
  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found. Candidate must be linked to an employee request first.')
  }

  const parsedDate = interviewDate ? new Date(interviewDate) : undefined
  const startResult = await candidateAssessmentRepository.startInterview(candidateId, parsedDate, interviewType)
  if (startResult.isFailure()) {
    throw new Error(startResult.error)
  }

  // Send interview schedule email to candidate
  if (interviewDate && interviewType) {
    const jobTitle = candidate.jobTitle?.name || 'Position'
    const portalUrl = `${process.env.CANDIDATE_PORTAL_URL || 'http://localhost:3001'}/profile`

    try {
      await sendInterviewScheduleEmail({
        candidateEmail: candidate.email,
        candidateName: candidate.fullname,
        jobTitle,
        interviewDate,
        interviewType,
        portalUrl,
      })
    } catch (error) {
      // Log but don't fail the operation if email fails
      console.error(`[EMAIL] Failed to send interview schedule email to ${candidate.email}:`, error)
    }
  }

  // Return updated progress
  const progressResult = await candidateAssessmentRepository.getProgress(candidateId)
  if (progressResult.isFailure()) {
    throw new Error(progressResult.error)
  }

  return progressResult.getValue()!
}

export async function updateInterview1(
  candidateId: number,
  status: AssessmentStatus,
  description: string,
  scoringPayload?: InterviewScoringPayload
): Promise<AssessmentProgress> {
  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)

  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found for this candidate')
  }

  // Dual-write: use formatted scoring as description if scoring provided
  const desc = scoringPayload ? formatScoringDescription(scoringPayload) : description

  const updateResult = await candidateAssessmentRepository.updateInterview1(
    Number(assessment.id),
    status,
    desc
  )

  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
  }

  // Write structured scoring to new table
  if (scoringPayload) {
    const scoringResult = await candidateAssessmentRepository.upsertScoring({
      assessmentId: assessment.id,
      stage: 'INTERVIEW1',
      ...scoringPayload.scoring,
      totalScore: computeTotalScore(scoringPayload.scoring),
      conclusion: scoringPayload.conclusion,
      keyCompetencies: scoringPayload.keyCompetencies ?? null,
      interviewerNotes: scoringPayload.interviewerNotes ?? null,
      assessedBy: scoringPayload.assessedBy ?? null,
    })

    if (scoringResult.isFailure()) {
      throw new Error(scoringResult.error)
    }

    // Set assessor assignees for Interview User stage
    if (scoringPayload.assessorIds && scoringPayload.assessorIds.length > 0) {
      const assigneesResult = await candidateAssessmentRepository.setAssignees(
        assessment.id,
        scoringPayload.assessorIds
      )

      if (assigneesResult.isFailure()) {
        throw new Error(assigneesResult.error)
      }

      // Send email notifications to assigned assessors
      await sendAssessorNotifications({
        candidateId,
        assessorIds: scoringPayload.assessorIds,
        interviewType: 'Interview User',
      })

      // Send in-app notification to assigned assessors
      try {
        const candidate = await candidateRepository.findById(candidateId)
        const candidateName = candidate.isSuccess()
          ? candidate.getValue()?.fullname || 'Unknown'
          : 'Unknown'

        const userIds: number[] = []
        for (const employeeId of scoringPayload.assessorIds) {
          const user = await prisma.user.findFirst({
            where: { employeeId, trash: null },
            select: { id: true },
          })
          if (user) userIds.push(user.id)
        }

        if (userIds.length > 0) {
          await sendRecruitmentNotification({
            type: RECRUITMENT_NOTIFICATION_TYPE.ASSESSOR_ASSIGNED,
            candidateId,
            candidateName,
            targetUserIds: userIds,
          })
        }
      } catch (err) {
        console.error('[NOTIFICATION] Failed to send assessor assigned notification:', err)
      }
    }
  }

  // Send rejection email if candidate failed
  if (status === 'FAILED') {
    sendRejectionNotification(candidateId, 'HR Assessment')
  }

  const progressResult = await candidateAssessmentRepository.getProgress(candidateId)
  if (progressResult.isFailure()) {
    throw new Error(progressResult.error)
  }

  return progressResult.getValue()!
}

export async function updateInterview2(
  candidateId: number,
  status: AssessmentStatus,
  description: string,
  scoringPayload?: InterviewScoringPayload
): Promise<AssessmentProgress> {
  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)

  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found for this candidate')
  }

  // Check if Interview 1 is passed (Interview 2 should be locked otherwise)
  if (assessment.interview1_status !== 'PASSED') {
    throw new BadRequestError('Cannot update Interview 2 before Interview 1 is passed')
  }

  // Dual-write: use formatted scoring as description if scoring provided
  const desc = scoringPayload ? formatScoringDescription(scoringPayload) : description

  const updateResult = await candidateAssessmentRepository.updateInterview2(
    Number(assessment.id),
    status,
    desc
  )

  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
  }

  // Write structured scoring to new table
  if (scoringPayload) {
    const scoringResult = await candidateAssessmentRepository.upsertScoring({
      assessmentId: assessment.id,
      stage: 'INTERVIEW2',
      ...scoringPayload.scoring,
      totalScore: computeTotalScore(scoringPayload.scoring),
      conclusion: scoringPayload.conclusion,
      keyCompetencies: scoringPayload.keyCompetencies ?? null,
      interviewerNotes: scoringPayload.interviewerNotes ?? null,
      assessedBy: scoringPayload.assessedBy ?? null,
    })

    if (scoringResult.isFailure()) {
      throw new Error(scoringResult.error)
    }
  }

  // Send rejection email if candidate failed
  if (status === 'FAILED') {
    sendRejectionNotification(candidateId, 'User Assessment')
  }

  // Send in-app notification to HR who invited the candidate (only for final results)
  if (status === 'PASSED' || status === 'FAILED') {
    try {
      const invitedBy = await candidateDetailRepository.getInvitedBy(candidateId)
      if (invitedBy) {
        const candidate = await candidateRepository.findById(candidateId)
        const candidateName = candidate.isSuccess()
          ? candidate.getValue()?.fullname || 'Unknown'
          : 'Unknown'

        await sendRecruitmentNotification({
          type: RECRUITMENT_NOTIFICATION_TYPE.INTERVIEW_USER_COMPLETED,
          candidateId,
          candidateName,
          targetUserIds: [invitedBy],
          extra: status === 'PASSED' ? 'Passed' : 'Failed',
        })
      }
    } catch (err) {
      console.error('[NOTIFICATION] Failed to send interview user completed notification:', err)
    }
  }

  const progressResult = await candidateAssessmentRepository.getProgress(candidateId)
  if (progressResult.isFailure()) {
    throw new Error(progressResult.error)
  }

  return progressResult.getValue()!
}

export async function scheduleMcu(
  candidateId: number,
  mcuDate: string,
  mcuLocation: string
): Promise<AssessmentProgress> {
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    throw new Error(candidateResult.error)
  }

  const candidate = candidateResult.getValue()
  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)
  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found for this candidate')
  }

  // Check if Interview 2 is passed (MCU should be locked otherwise)
  if (assessment.interview2_status !== 'PASSED') {
    throw new BadRequestError('Cannot schedule MCU before Interview 2 is passed')
  }

  const parsedDate = new Date(mcuDate)
  const scheduleResult = await candidateAssessmentRepository.scheduleMcu(candidateId, parsedDate, mcuLocation)
  if (scheduleResult.isFailure()) {
    throw new Error(scheduleResult.error)
  }

  // Send MCU schedule email to candidate
  const jobTitle = candidate.jobTitle?.name || 'Position'
  const portalUrl = `${process.env.CANDIDATE_PORTAL_URL || 'http://localhost:3001'}/profile`

  try {
    await sendMcuScheduleEmail({
      candidateEmail: candidate.email,
      candidateName: candidate.fullname,
      jobTitle,
      mcuDate,
      mcuLocation,
      portalUrl,
    })
  } catch (error) {
    console.error(`[EMAIL] Failed to send MCU schedule email to ${candidate.email}:`, error)
  }

  const progressResult = await candidateAssessmentRepository.getProgress(candidateId)
  if (progressResult.isFailure()) {
    throw new Error(progressResult.error)
  }

  return progressResult.getValue()!
}

export async function updateMcu(
  candidateId: number,
  status: AssessmentStatus,
  description: string,
  documentUrl?: string | null,
  documentName?: string | null
): Promise<AssessmentProgress> {
  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)

  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found for this candidate')
  }

  // Check if Interview 2 is passed (MCU should be locked otherwise)
  if (assessment.interview2_status !== 'PASSED') {
    throw new BadRequestError('Cannot update MCU before Interview 2 is passed')
  }

  const updateResult = await candidateAssessmentRepository.updateMcu(
    Number(assessment.id),
    status,
    description,
    documentUrl,
    documentName
  )

  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
  }

  // Send rejection email if candidate failed
  if (status === 'FAILED') {
    sendRejectionNotification(candidateId, 'Medical Check-Up')
  }

  const progressResult = await candidateAssessmentRepository.getProgress(candidateId)
  if (progressResult.isFailure()) {
    throw new Error(progressResult.error)
  }

  return progressResult.getValue()!
}

export async function uploadMcuDocument(
  candidateId: number,
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; name: string }> {
  const { uploadToS3 } = await import('../config/s3.js')

  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)

  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found for this candidate')
  }

  // Upload to S3
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const s3Key = `mcu-documents/${candidateId}/${timestamp}_${sanitizedName}`

  const url = await uploadToS3(s3Key, fileBuffer, contentType)

  // Save document reference in database
  const updateResult = await candidateAssessmentRepository.updateMcuDocument(
    Number(assessment.id),
    url,
    fileName
  )

  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
  }

  return { url, name: fileName }
}

export async function getMcuDocument(
  candidateId: number
): Promise<{ url: string | null; name: string | null; presignedUrl: string | null }> {
  const result = await candidateAssessmentRepository.getMcuDocument(candidateId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  const doc = result.getValue()
  if (!doc || !doc.url) {
    return { url: null, name: null, presignedUrl: null }
  }

  // Generate presigned URL for secure access
  const { getPresignedUrl } = await import('../config/s3.js')

  // Extract S3 key from full URL
  const urlObj = new URL(doc.url)
  const s3Key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname

  const presignedUrl = await getPresignedUrl(s3Key)

  return { url: doc.url, name: doc.name, presignedUrl }
}

export async function deleteMcuDocument(candidateId: number): Promise<void> {
  const docResult = await candidateAssessmentRepository.getMcuDocument(candidateId)

  if (docResult.isFailure()) {
    throw new Error(docResult.error)
  }

  const doc = docResult.getValue()
  if (!doc || !doc.url) {
    throw new NotFoundError('No MCU document found for this candidate')
  }

  // Delete from S3
  const { deleteFromS3 } = await import('../config/s3.js')
  const urlObj = new URL(doc.url)
  const s3Key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname
  await deleteFromS3(s3Key)

  // Clear reference in database
  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)
  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (assessment) {
    await candidateAssessmentRepository.updateMcuDocument(
      Number(assessment.id),
      '',
      ''
    )
  }
}

// ==================== Assessment Scoring Services ====================

export async function getAssessmentScoring(
  candidateId: number,
  stage?: 'INTERVIEW1' | 'INTERVIEW2'
) {
  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)

  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found for this candidate')
  }

  if (stage) {
    const result = await candidateAssessmentRepository.findScoringByAssessmentAndStage(
      assessment.id,
      stage
    )
    if (result.isFailure()) {
      throw new Error(result.error)
    }
    return result.getValue()
  }

  const result = await candidateAssessmentRepository.findScoringByAssessmentId(assessment.id)
  if (result.isFailure()) {
    throw new Error(result.error)
  }
  return result.getValue()
}

export type AssessmentAssignee = {
  employeeId: number
  employeeName: string | null
  employeeEmail: string | null
  assignedAt: Date
}

export async function getAssessmentAssignees(candidateId: number): Promise<AssessmentAssignee[]> {
  const assigneeIdsResult = await candidateAssessmentRepository.getAssigneesByCandidateId(candidateId)

  if (assigneeIdsResult.isFailure()) {
    throw new Error(assigneeIdsResult.error)
  }

  const employeeIds = assigneeIdsResult.getValue()
  if (employeeIds.length === 0) {
    return []
  }

  // Fetch employee details for each assignee
  const assignees: AssessmentAssignee[] = []
  for (const employeeId of employeeIds) {
    const employeeResult = await employeeRepository.findById(employeeId)
    if (employeeResult.isSuccess()) {
      const employee = employeeResult.getValue()
      if (employee) {
        assignees.push({
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          employeeEmail: employee.employeeEmail,
          assignedAt: new Date(),
        })
      }
    }
  }

  return assignees
}

// ==================== Onboarding Services ====================

export async function getOnboarding(candidateId: number): Promise<OnboardingWithRelations | null> {
  const result = await onboardingRepository.findOnboardingByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function createOnboarding(
  candidateId: number,
  data: { jobPlacement?: string | undefined }
): Promise<OnboardingWithRelations> {
  // Check if candidate exists
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    throw new Error(candidateResult.error)
  }

  const candidate = candidateResult.getValue()
  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  // Check if candidate has passed all assessments
  const passedResult = await candidateAssessmentRepository.hasPassedAllAssessments(candidateId)
  if (passedResult.isFailure()) {
    throw new Error(passedResult.error)
  }

  if (!passedResult.getValue()) {
    throw new BadRequestError('Candidate must pass all assessments before onboarding')
  }

  // Check if onboarding already exists
  const existingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  if (existingResult.getValue()) {
    throw new ConflictError('Onboarding already exists for this candidate')
  }

  // Get the detail record
  const detailResult = await candidateDetailRepository.findByCandidateId(candidateId)
  if (detailResult.isFailure()) {
    throw new Error(detailResult.error)
  }

  const detail = detailResult.getValue()
  if (!detail) {
    throw new NotFoundError('Candidate detail not found')
  }

  // Create onboarding
  const createResult = await onboardingRepository.createOnboarding({
    candidateId,
    employeeRequestId: parseInt(detail.employee_request_id, 10),
    candidateRecruitmentDetailId: Number(detail.id),
    jobPlacement: data.jobPlacement
  })

  if (createResult.isFailure()) {
    throw new Error(createResult.error)
  }

  // Fetch with relations
  const onboardingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (onboardingResult.isFailure()) {
    throw new Error(onboardingResult.error)
  }

  return onboardingResult.getValue()!
}

export async function updateOnboarding(
  candidateId: number,
  data: { jobPlacement?: string | undefined; document?: string | undefined; documentCandidate?: string | undefined; joinDate?: string | undefined }
): Promise<OnboardingWithRelations> {
  const existingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (existingResult.isFailure()) {
    throw new Error(existingResult.error)
  }

  const existing = existingResult.getValue()
  if (!existing) {
    throw new NotFoundError('Onboarding not found for this candidate')
  }

  const updateResult = await onboardingRepository.updateOnboarding(Number(existing.id), data)
  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
  }

  // Fetch with relations
  const onboardingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (onboardingResult.isFailure()) {
    throw new Error(onboardingResult.error)
  }

  return onboardingResult.getValue()!
}

// ==================== Facility Services ====================

export async function addFacility(
  candidateId: number,
  data: {
    item: string
    qty: number
    unit: string
    condition: string
    status: string
    pic_employee_ids: number[]
  }
) {
  const onboardingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (onboardingResult.isFailure()) {
    throw new Error(onboardingResult.error)
  }

  const onboarding = onboardingResult.getValue()
  if (!onboarding) {
    throw new NotFoundError('Onboarding not found for this candidate')
  }

  const result = await onboardingRepository.createFacility({
    onboardingId: Number(onboarding.id),
    item: data.item,
    qty: data.qty,
    unit: data.unit,
    condition: data.condition,
    status: data.status,
    pic_employee_ids: data.pic_employee_ids,
  })

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateFacility(
  facilityId: number,
  data: {
    item?: string
    qty?: number
    unit?: string
    condition?: string
    status?: string
    pic_employee_ids?: number[]
  }
) {
  const result = await onboardingRepository.updateFacility(facilityId, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteFacility(facilityId: number): Promise<void> {
  const result = await onboardingRepository.removeFacility(facilityId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

// ==================== Program Services ====================

export async function addProgram(
  candidateId: number,
  data: {
    program: string
    date: string
    location: string
    pic_employee_ids: number[]
    status: string
  }
) {
  const onboardingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (onboardingResult.isFailure()) {
    throw new Error(onboardingResult.error)
  }

  const onboarding = onboardingResult.getValue()
  if (!onboarding) {
    throw new NotFoundError('Onboarding not found for this candidate')
  }

  const result = await onboardingRepository.createProgram({
    onboardingId: Number(onboarding.id),
    program: data.program,
    date: data.date,
    location: data.location,
    status: data.status,
    pic_employee_ids: data.pic_employee_ids,
  })

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateProgram(
  programId: number,
  data: {
    program?: string
    date?: string
    location?: string
    pic_employee_ids?: number[]
    status?: string
  }
) {
  const result = await onboardingRepository.updateProgram(programId, data)

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function deleteProgram(programId: number): Promise<void> {
  const result = await onboardingRepository.removeProgram(programId)

  if (result.isFailure()) {
    throw new Error(result.error)
  }
}

// ==================== Send Onboarding Email ====================

// Format snake_case to Title Case
function formatJobPlacement(value: string): string {
  if (!value) return ''
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export async function sendOnboardingEmail(
  candidateId: number,
  portalBaseUrl: string,
  params?: { joinDate?: string; workLocation?: string }
): Promise<void> {
  // Get candidate data
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    throw new Error(candidateResult.error)
  }

  const candidate = candidateResult.getValue()
  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  // Get onboarding data
  const onboardingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (onboardingResult.isFailure()) {
    throw new Error(onboardingResult.error)
  }

  const onboarding = onboardingResult.getValue()
  if (!onboarding) {
    throw new BadRequestError('Onboarding data not found. Please complete onboarding form first.')
  }

  // Save join_date and job_placement if provided
  const updateData: { joinDate?: string; jobPlacement?: string } = {}
  if (params?.joinDate) updateData.joinDate = params.joinDate
  if (params?.workLocation) updateData.jobPlacement = params.workLocation

  if (Object.keys(updateData).length > 0) {
    const saveResult = await onboardingRepository.updateOnboarding(Number(onboarding.id), updateData)
    if (saveResult.isFailure()) {
      console.error(`[ONBOARDING] Failed to save join_date/job_placement:`, saveResult.error)
    }
  }

  // Get job title
  const jobTitle = candidate.jobTitle?.name || 'Position'

  // Resolve work location and join date
  const workLocation = params?.workLocation
    || formatJobPlacement(onboarding.job_placement || '')
  const joinDate = params?.joinDate || onboarding.join_date || 'To be confirmed'

  // Portal URL for candidate to confirm
  const portalUrl = `${portalBaseUrl}/candidate-portal/onboarding`

  // Send candidate email
  await sendOnboardingEmailToCandidate({
    candidateName: candidate.fullname,
    candidateEmail: candidate.email,
    jobTitle,
    workLocation,
    joinDate,
    portalUrl,
  })

  // Mark onboarding as sent
  await onboardingRepository.updateOnboarding(Number(onboarding.id), {
    onboardingSentAt: new Date(),
  })

  // --- Send PIC emails (best-effort) ---

  // Re-fetch onboarding to get latest facilities/programs with pics
  const refreshedResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  const refreshed = refreshedResult.isSuccess() ? refreshedResult.getValue() : onboarding

  const candidateName = candidate.fullname

  // Group facilities by PIC employee_id
  if (refreshed?.facilities && refreshed.facilities.length > 0) {
    const facilityByPic = new Map<number, Array<{ item: string; qty: number; condition: string }>>()

    for (const facility of refreshed.facilities) {
      if (facility.pics && facility.pics.length > 0) {
        for (const pic of facility.pics) {
          const empId = pic.employee_id
          if (!facilityByPic.has(empId)) {
            facilityByPic.set(empId, [])
          }
          facilityByPic.get(empId)!.push({
            item: facility.item,
            qty: facility.qty,
            condition: facility.condition,
          })
        }
      }
    }

    for (const [empId, facilities] of facilityByPic) {
      try {
        const empResult = await employeeRepository.findById(empId)
        if (empResult.isFailure() || !empResult.getValue()) {
          console.error(`[PIC_EMAIL] Employee ${empId} not found, skipping facility PIC email`)
          continue
        }
        const emp = empResult.getValue()!
        if (!emp.employeeEmail) {
          console.error(`[PIC_EMAIL] Employee ${empId} has no email, skipping facility PIC email`)
          continue
        }

        await sendFacilityPicEmail({
          picName: emp.employeeName || `Employee ${empId}`,
          picEmail: emp.employeeEmail,
          candidateName,
          joinDate,
          workLocation,
          facilities,
        })
      } catch (err: unknown) {
        console.error(`[PIC_EMAIL] Failed to send facility PIC email to employee ${empId}:`, err)
      }
    }
  }

  // Group programs by PIC employee_id
  if (refreshed?.programs && refreshed.programs.length > 0) {
    const programByPic = new Map<number, Array<{ program: string; date: string; location: string }>>()

    for (const prog of refreshed.programs) {
      if (prog.pics && prog.pics.length > 0) {
        for (const pic of prog.pics) {
          const empId = pic.employee_id
          if (!programByPic.has(empId)) {
            programByPic.set(empId, [])
          }
          programByPic.get(empId)!.push({
            program: prog.program,
            date: prog.date,
            location: prog.location,
          })
        }
      }
    }

    for (const [empId, programs] of programByPic) {
      try {
        const empResult = await employeeRepository.findById(empId)
        if (empResult.isFailure() || !empResult.getValue()) {
          console.error(`[PIC_EMAIL] Employee ${empId} not found, skipping program PIC email`)
          continue
        }
        const emp = empResult.getValue()!
        if (!emp.employeeEmail) {
          console.error(`[PIC_EMAIL] Employee ${empId} has no email, skipping program PIC email`)
          continue
        }

        await sendProgramPicEmail({
          picName: emp.employeeName || `Employee ${empId}`,
          picEmail: emp.employeeEmail,
          candidateName,
          joinDate,
          programs,
        })
      } catch (err: unknown) {
        console.error(`[PIC_EMAIL] Failed to send program PIC email to employee ${empId}:`, err)
      }
    }
  }
}

// ==================== Accept Onboarding ====================

/**
 * Candidate accepts onboarding offer.
 *
 * Runs an atomic transaction that:
 *   1. Sets onboarding_accepted_at = NOW
 *   2. Marks the employee_request as completed (status 7)
 *   3. Inserts the employee_list row (with superior_id = 0 by default)
 *   4. Inserts the users row (Employee role) linked to the new employee
 *
 * If the transaction fails, ALL writes roll back so the candidate stays in
 * "awaiting acceptance" and can safely retry once HR resolves the underlying
 * issue. Welcome email + HR notifications are sent fire-and-forget AFTER the
 * transaction commits.
 */
export async function acceptOnboarding(candidateId: number): Promise<OnboardingWithRelations> {
  // ---- Preflight (read-only) ----------------------------------------------

  const onboardingResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (onboardingResult.isFailure()) {
    throw new Error(onboardingResult.error)
  }
  const onboarding = onboardingResult.getValue()
  if (!onboarding) {
    throw new NotFoundError('Onboarding not found for this candidate')
  }

  // Pre-transaction guard #1: idempotency by acceptance timestamp
  if (onboarding.onboardingAcceptedAt) {
    throw new ConflictError('Onboarding has already been accepted')
  }

  // Pre-transaction guard #2: assessments must all pass
  const passedResult = await candidateAssessmentRepository.hasPassedAllAssessments(candidateId)
  if (passedResult.isFailure()) {
    throw new Error(passedResult.error)
  }
  if (!passedResult.getValue()) {
    throw new BadRequestError('Candidate must pass all assessments before accepting onboarding')
  }

  // Pre-transaction guard #3: onboarding must be complete (job placement,
  // at least 1 facility, at least 1 program)
  const onboardingCompleteResult = await onboardingRepository.isOnboardingComplete(candidateId)
  if (onboardingCompleteResult.isFailure()) {
    throw new Error(onboardingCompleteResult.error)
  }
  if (!onboardingCompleteResult.getValue()) {
    throw new BadRequestError('Onboarding must be complete (job placement, at least 1 facility, at least 1 program)')
  }

  // Load candidate
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    throw new Error(candidateResult.error)
  }
  const candidate = candidateResult.getValue()
  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }
  if (!candidate.email) {
    throw new BadRequestError('Candidate has no email — cannot create user account')
  }

  // Pre-transaction guard #4: idempotency by employee email — covers the case
  // where an Employee row already exists from a previous successful run.
  const emailExistsResult = await employeeRepository.emailExists(candidate.email)
  if (emailExistsResult.isFailure()) {
    throw new Error(emailExistsResult.error)
  }
  if (emailExistsResult.getValue()) {
    throw new ConflictError('Onboarding already accepted')
  }

  // Load candidate detail (job_title_id, employee_request_id)
  const detailResult = await candidateDetailRepository.findByCandidateId(candidateId)
  if (detailResult.isFailure()) {
    throw new Error(detailResult.error)
  }
  const detail = detailResult.getValue()
  if (!detail) {
    throw new NotFoundError('Candidate detail not found')
  }

  // Resolve employee request → departmentId (optional, walk-in candidates may not have one)
  let departmentId: number | undefined
  let employeeRequestId: number | null = null
  const parsedRequestId = parseInt(detail.employee_request_id, 10)
  if (!isNaN(parsedRequestId) && parsedRequestId > 0) {
    employeeRequestId = parsedRequestId
    const empRequestResult = await employeeRequestRepository.findById(parsedRequestId)
    if (empRequestResult.isSuccess()) {
      departmentId = empRequestResult.getValue()?.departmentId ?? undefined
    }
  }

  // Resolve "Employee" role
  const roleResult = await roleRepository.findByName(DEFAULT_EMPLOYEE_ROLE_NAME)
  if (roleResult.isFailure()) {
    throw new Error(roleResult.error)
  }
  const role = roleResult.getValue()
  if (!role) {
    throw new Error(`Default role "${DEFAULT_EMPLOYEE_ROLE_NAME}" not found in role_access table`)
  }

  // ---- Build transaction payload (no DB writes) ---------------------------

  // Parse join_date (String? -> Date), fallback to current date
  let joinDate: Date = new Date()
  if (onboarding.join_date) {
    const parsed = new Date(onboarding.join_date)
    if (!isNaN(parsed.getTime())) {
      joinDate = parsed
    }
  }

  const employeeData: Prisma.EmployeeCreateInput = {
    uuid: randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
    employeeName: candidate.fullname,
    employeeStatus: 'active',
    superiorId: 0,
    employeeJoindate: joinDate,
    employeeEmail: candidate.email,
    ...(candidate.gender ? { employeeGender: candidate.gender } : {}),
    ...(candidate.id_no ? { employeeNik: candidate.id_no } : {}),
    ...(candidate.birth_date ? { employeeBirthdate: candidate.birth_date } : {}),
    ...(candidate.marrital_status ? { employeeMaritalstatus: candidate.marrital_status } : {}),
    ...(candidate.religion ? { employeeReligion: candidate.religion } : {}),
    ...(candidate.ethnic_group ? { employeeEthnic: candidate.ethnic_group } : {}),
    ...(candidate.citizenship ? { employeeNationality: candidate.citizenship } : {}),
    ...(candidate.address ? { employeeAddress: candidate.address } : {}),
    ...(candidate.mobile_phone ? { employeeContact: candidate.mobile_phone } : {}),
    ...(onboarding.job_placement ? { employeeLocation: onboarding.job_placement } : {}),
    ...(departmentId !== undefined ? { department: { connect: { id: departmentId } } } : {}),
    ...(detail.job_title_id ? { jobTitle: { connect: { id: BigInt(detail.job_title_id) } } } : {})
  }

  const generatedPassword = generateRandomPassword()
  const hashedPassword = await bcrypt.hash(generatedPassword, 10)

  const userData: Omit<Prisma.UserUncheckedCreateInput, 'employeeId'> = {
    name: candidate.fullname,
    displayName: candidate.fullname,
    email: candidate.email,
    password: hashedPassword,
    roleId: role.roleId
  }

  // ---- Transaction --------------------------------------------------------

  const conversionResult = await onboardingConversionRepository.acceptOnboardingAndConvert({
    candidateId,
    onboardingId: onboarding.id,
    employeeRequestId,
    employee: employeeData,
    user: userData
  })

  if (conversionResult.isFailure()) {
    // Transaction rolled back — notify HR with the error and re-throw so the
    // candidate sees a generic error toast.
    const errorMessage = conversionResult.error
    console.error(`[ACCEPT-ONBOARDING] Conversion transaction failed for candidate ${candidateId}:`, errorMessage)

    notifyHrConversionFailed(candidateId, errorMessage).catch((notifErr) => {
      console.error('[ACCEPT-ONBOARDING] Failed to send conversion failure notification:', notifErr)
    })

    throw new Error(`Failed to accept onboarding: ${errorMessage}`)
  }

  const { employeeId, userId } = conversionResult.getValue()
  console.log(`[ACCEPT-ONBOARDING] Candidate ${candidateId} converted: employee=${employeeId}, user=${userId}`)

  // ---- Post-commit side effects (fire-and-forget) -------------------------

  sendWelcomeEmail({
    email: candidate.email,
    displayName: candidate.fullname,
    password: generatedPassword
  }).catch((err) => {
    console.error(`[ACCEPT-ONBOARDING] Failed to send welcome email to ${candidate.email}:`, err)
  })

  notifyHrOnboardingAccepted(candidateId, candidate.fullname, employeeId).catch((notifErr) => {
    console.error('[ACCEPT-ONBOARDING] Failed to send onboarding accepted notification:', notifErr)
  })

  // Re-fetch with relations so the candidate UI gets a consistent payload
  const refreshedResult = await onboardingRepository.findOnboardingByCandidateId(candidateId)
  if (refreshedResult.isFailure()) {
    throw new Error(refreshedResult.error)
  }
  return refreshedResult.getValue()!
}

// Generate random 8-character password (alphanumeric, uppercase hex)
function generateRandomPassword(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

async function notifyHrOnboardingAccepted(
  candidateId: number,
  candidateName: string,
  employeeId: number
): Promise<void> {
  const invitedBy = await candidateDetailRepository.getInvitedBy(candidateId)
  if (!invitedBy) return

  await sendRecruitmentNotification({
    type: RECRUITMENT_NOTIFICATION_TYPE.ONBOARDING_ACCEPTED,
    candidateId,
    candidateName,
    targetUserIds: [invitedBy],
    extra: `employee_id=${employeeId}`
  })
}

async function notifyHrConversionFailed(
  candidateId: number,
  errorMessage: string
): Promise<void> {
  const invitedBy = await candidateDetailRepository.getInvitedBy(candidateId)
  if (!invitedBy) return

  const candidateResult = await candidateRepository.findById(candidateId)
  const candidateName = candidateResult.isSuccess()
    ? candidateResult.getValue()?.fullname || 'Unknown'
    : 'Unknown'

  await sendRecruitmentNotification({
    type: RECRUITMENT_NOTIFICATION_TYPE.CONVERSION_FAILED,
    candidateId,
    candidateName,
    targetUserIds: [invitedBy],
    extra: errorMessage
  })
}
