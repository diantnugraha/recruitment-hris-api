import type { CandidateRecruitment } from '@prisma/client'
import { randomBytes } from 'crypto'

import { NotFoundError, ConflictError, BadRequestError } from '../errors/index.js'
import { sendCandidateInvitationEmail } from './emailService.js'
import * as candidateRepository from '../repositories/candidateRepository.js'
import * as candidateDetailRepository from '../repositories/candidateDetailRepository.js'
import * as candidateAssessmentRepository from '../repositories/candidateAssessmentRepository.js'
import * as onboardingRepository from '../repositories/onboardingRepository.js'

// Generate random 8-character password (alphanumeric)
function generateRandomPassword(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}
import type {
  CandidateFilters,
  PaginationParams,
  CandidateWithDetail
} from '../repositories/candidateRepository.js'
import type { AssessmentStatus, AssessmentProgress } from '../repositories/candidateAssessmentRepository.js'
import type { OnboardingWithRelations } from '../repositories/onboardingRepository.js'

// ==================== Type Definitions ====================

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
  portalBaseUrl: string
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

export async function updateInterview1(
  candidateId: number,
  status: AssessmentStatus,
  description: string
): Promise<AssessmentProgress> {
  const assessmentResult = await candidateAssessmentRepository.findByCandidateId(candidateId)

  if (assessmentResult.isFailure()) {
    throw new Error(assessmentResult.error)
  }

  const assessment = assessmentResult.getValue()
  if (!assessment) {
    throw new NotFoundError('Assessment not found for this candidate')
  }

  const updateResult = await candidateAssessmentRepository.updateInterview1(
    Number(assessment.id),
    status,
    description
  )

  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
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
  description: string
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

  const updateResult = await candidateAssessmentRepository.updateInterview2(
    Number(assessment.id),
    status,
    description
  )

  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
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
  description: string
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
    description
  )

  if (updateResult.isFailure()) {
    throw new Error(updateResult.error)
  }

  const progressResult = await candidateAssessmentRepository.getProgress(candidateId)
  if (progressResult.isFailure()) {
    throw new Error(progressResult.error)
  }

  return progressResult.getValue()!
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
  data: { jobPlacement?: string | undefined; document?: string | undefined; documentCandidate?: string | undefined }
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
    inventoryNo: string
    item: string
    qty: number
    unit: string
    condition: string
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

  const result = await onboardingRepository.createFacility({
    onboardingId: Number(onboarding.id),
    ...data
  })

  if (result.isFailure()) {
    throw new Error(result.error)
  }

  return result.getValue()
}

export async function updateFacility(
  facilityId: number,
  data: {
    inventoryNo?: string
    item?: string
    qty?: number
    unit?: string
    condition?: string
    status?: string
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
    pic: string
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
    ...data
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
    pic?: string
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

// ==================== Convert to Employee ====================

export async function convertToEmployee(candidateId: number): Promise<{ success: boolean; message: string }> {
  // Check if candidate exists
  const candidateResult = await candidateRepository.findById(candidateId)
  if (candidateResult.isFailure()) {
    throw new Error(candidateResult.error)
  }

  const candidate = candidateResult.getValue()
  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  // Check if all assessments passed
  const passedResult = await candidateAssessmentRepository.hasPassedAllAssessments(candidateId)
  if (passedResult.isFailure()) {
    throw new Error(passedResult.error)
  }

  if (!passedResult.getValue()) {
    throw new BadRequestError('Candidate must pass all assessments before converting to employee')
  }

  // Check if onboarding is complete
  const onboardingCompleteResult = await onboardingRepository.isOnboardingComplete(candidateId)
  if (onboardingCompleteResult.isFailure()) {
    throw new Error(onboardingCompleteResult.error)
  }

  if (!onboardingCompleteResult.getValue()) {
    throw new BadRequestError('Onboarding must be complete (job placement, at least 1 facility, at least 1 program)')
  }

  // TODO: Create employee record with data from candidate
  // TODO: Create user account for employee
  // TODO: Update employee request status

  return {
    success: true,
    message: 'Employee record created successfully'
  }
}
