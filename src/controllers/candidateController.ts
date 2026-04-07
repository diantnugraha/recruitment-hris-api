import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type { StartAssessmentBody, ScheduleMcuBody } from '../schemas/candidateSchemas.js'
import * as candidateService from '../services/candidateService.js'
import * as candidateProfileRepository from '../repositories/candidateProfileRepository.js'
import * as employeeRepository from '../repositories/employeeRepository.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'
import type { CandidateWithDetail } from '../repositories/candidateRepository.js'
import type { AssessmentStatus } from '../repositories/candidateAssessmentRepository.js'

// Query types
type CandidateQuery = {
  page?: number
  limit?: number
  name?: string
  email?: string
  verified?: boolean
  job_title_id?: number
  employee_request_id?: number
}

type CreateCandidateBody = {
  fullname: string
  email: string
  address?: string
  resident_status?: string
  birth_place?: string
  birth_date?: string
  religion?: string
  ethnic_group?: string
  id_no?: string
  tax_id?: string
  bpjs_id?: string
  citizenship?: string
  marrital_status?: string
  gender?: 'M' | 'F'
  mobile_phone?: string
  driving_license?: string
  employee_request_id?: number
  job_title_id?: number
}

type UpdateCandidateBody = Partial<CreateCandidateBody>

type AssessmentUpdateBody = {
  status: 'PASSED' | 'FAILED'
  description: string
}

type InterviewUpdateBody = AssessmentUpdateBody & {
  scoring?: {
    relevance_of_experience: number
    training_undertaken: number
    technical_skills: number
    non_technical_skills: number
    communication_skills: number
    emotional_maturity: number
    understanding_of_position: number
    teamwork_ability: number
  }
  conclusion?: 'PROCEED' | 'RECOMMENDED' | 'REJECTED'
  key_competencies?: string | null
  interviewer_notes?: string | null
  assessed_by?: string | null
  assessor_ids?: number[]
}

type ScoringQuery = {
  stage?: 'interview1' | 'interview2'
}

type OnboardingBody = {
  job_placement?: string
  document?: string
  document_candidate?: string
  join_date?: string
}

type FacilityBody = {
  item: string
  qty: number
  unit: string
  condition: string
  status: string
  pic_employee_ids: number[]
}

type ProgramBody = {
  program: string
  date: string
  location: string
  pic_employee_ids: number[]
  status: string
}

// Transform candidate for API response
function transformCandidate(candidate: CandidateWithDetail) {
  return {
    id: Number(candidate.id),
    fullname: candidate.fullname,
    email: candidate.email,
    address: candidate.address,
    resident_status: candidate.resident_status,
    birth_place: candidate.birth_place,
    birth_date: candidate.birth_date?.toISOString().split('T')[0],
    religion: candidate.religion,
    ethnic_group: candidate.ethnic_group,
    id_no: candidate.id_no,
    tax_id: candidate.tax_id,
    bpjs_id: candidate.bpjs_id,
    citizenship: candidate.citizenship,
    marrital_status: candidate.marrital_status,
    gender: candidate.gender,
    mobile_phone: candidate.mobile_phone,
    driving_license: candidate.driving_license,
    verify: candidate.verify,
    created_at: candidate.createdAt?.toISOString() || null,
    updated_at: candidate.updatedAt?.toISOString() || null,
    // Detail (link to job title and employee request)
    detail: candidate.detail ? {
      id: Number(candidate.detail.id),
      job_title_id: candidate.detail.job_title_id,
      employee_request_id: candidate.detail.employee_request_id,
      candidate_code: candidate.detail.candidate_code,
      candidate_verify: candidate.detail.candidate_verify
    } : null,
    // Assessment status
    assessment: candidate.assessment ? {
      id: Number(candidate.assessment.id),
      interview1_status: candidate.assessment.interview1_status,
      interview1_desc: candidate.assessment.interview1_desc,
      interview2_status: candidate.assessment.interview2_status,
      interview2_desc: candidate.assessment.interview2_desc,
      mcu_status: candidate.assessment.mcu_status,
      mcu_desc: candidate.assessment.mcu_desc,
      expected_salary: candidate.assessment.expected_salary,
      last_salary: candidate.assessment.last_salary,
      when_ready_work: candidate.assessment.when_ready_work
    } : null,
    // Relations
    job_title: candidate.jobTitle ? {
      id: Number(candidate.jobTitle.id),
      name: candidate.jobTitle.name
    } : null,
    employee_request: candidate.employeeRequest ? {
      id: Number(candidate.employeeRequest.id),
      code: candidate.employeeRequest.code,
      job_placement: candidate.employeeRequest.jobPlacement
    } : null,
    onboarding_accepted_at: candidate.onboarding?.onboardingAcceptedAt?.toISOString() || null,
    onboarding_sent_at: candidate.onboarding?.onboardingSentAt?.toISOString() || null
  }
}

// Helper to enrich PIC employee IDs with name and email
async function enrichPics(pics: Array<{ id: bigint; employee_id: number }>): Promise<Array<{ id: number; employee_id: number; name: string; email: string }>> {
  const enriched: Array<{ id: number; employee_id: number; name: string; email: string }> = []
  for (const pic of pics) {
    const empResult = await employeeRepository.findById(pic.employee_id)
    const emp = empResult.isSuccess() ? empResult.getValue() : null
    enriched.push({
      id: Number(pic.id),
      employee_id: pic.employee_id,
      name: emp?.employeeName || `Employee ${pic.employee_id}`,
      email: emp?.employeeEmail || ''
    })
  }
  return enriched
}

// ==================== CRUD Endpoints ====================

export async function getAll(
  request: FastifyRequest<{ Querystring: CandidateQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name, email, verified, job_title_id, employee_request_id } = request.query

  const filters = {
    ...(name && { name }),
    ...(email && { email }),
    ...(verified !== undefined && { verified }),
    ...(job_title_id && { jobTitleId: job_title_id }),
    ...(employee_request_id && { employeeRequestId: employee_request_id })
  }

  const pagination = { page, limit }

  const result = await candidateService.getAllCandidates(filters, pagination)

  const transformedItems = result.items.map(transformCandidate)
  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, transformedItems, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const candidate = await candidateService.getCandidateById(id)
  const transformed = transformCandidate(candidate)

  sendSuccess(reply, transformed)
}

export async function getByEmployeeRequest(
  request: FastifyRequest<{ Params: { employeeRequestId: number }; Querystring: { page?: number; limit?: number } }>,
  reply: FastifyReply
): Promise<void> {
  const { employeeRequestId } = request.params
  const { page = 1, limit = 20 } = request.query

  const result = await candidateService.getCandidatesByEmployeeRequest(employeeRequestId, { page, limit })

  const transformedItems = result.items.map(transformCandidate)
  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, transformedItems, paginationData)
}

export async function create(
  request: FastifyRequest<{ Body: CreateCandidateBody }>,
  reply: FastifyReply
): Promise<void> {
  const body = request.body

  const data = {
    fullname: body.fullname,
    email: body.email,
    ...(body.address && { address: body.address }),
    ...(body.resident_status && { residentStatus: body.resident_status }),
    ...(body.birth_place && { birthPlace: body.birth_place }),
    ...(body.birth_date && { birthDate: new Date(body.birth_date) }),
    ...(body.religion && { religion: body.religion }),
    ...(body.ethnic_group && { ethnicGroup: body.ethnic_group }),
    ...(body.id_no && { idNo: body.id_no }),
    ...(body.tax_id && { taxId: body.tax_id }),
    ...(body.bpjs_id && { bpjsId: body.bpjs_id }),
    ...(body.citizenship && { citizenship: body.citizenship }),
    ...(body.marrital_status && { marritalStatus: body.marrital_status }),
    ...(body.gender && { gender: body.gender }),
    ...(body.mobile_phone && { mobilePhone: body.mobile_phone }),
    ...(body.driving_license && { drivingLicense: body.driving_license }),
    ...(body.employee_request_id && { employeeRequestId: body.employee_request_id }),
    ...(body.job_title_id && { jobTitleId: body.job_title_id })
  }

  const candidate = await candidateService.createCandidate(data)
  const transformed = transformCandidate(candidate)

  sendSuccess(reply, transformed, 'Candidate created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateCandidateBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const body = request.body

  const data = {
    ...(body.fullname && { fullname: body.fullname }),
    ...(body.email && { email: body.email }),
    ...(body.address && { address: body.address }),
    ...(body.resident_status && { residentStatus: body.resident_status }),
    ...(body.birth_place && { birthPlace: body.birth_place }),
    ...(body.birth_date && { birthDate: new Date(body.birth_date) }),
    ...(body.religion && { religion: body.religion }),
    ...(body.ethnic_group && { ethnicGroup: body.ethnic_group }),
    ...(body.id_no && { idNo: body.id_no }),
    ...(body.tax_id && { taxId: body.tax_id }),
    ...(body.bpjs_id && { bpjsId: body.bpjs_id }),
    ...(body.citizenship && { citizenship: body.citizenship }),
    ...(body.marrital_status && { marritalStatus: body.marrital_status }),
    ...(body.gender && { gender: body.gender }),
    ...(body.mobile_phone && { mobilePhone: body.mobile_phone }),
    ...(body.driving_license && { drivingLicense: body.driving_license })
  }

  const candidate = await candidateService.updateCandidate(id, data)
  const transformed = transformCandidate(candidate)

  sendSuccess(reply, transformed, 'Candidate updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await candidateService.deleteCandidate(id)

  reply.status(204).send()
}

export async function generateToken(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const token = await candidateService.generateCandidateToken(id)

  sendSuccess(reply, { token }, 'Token generated successfully')
}

type SendInvitationBody = {
  portal_base_url: string
}

export async function sendInvitation(
  request: FastifyRequest<{ Params: IdParam; Body: SendInvitationBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { portal_base_url } = request.body

  const result = await candidateService.sendCandidateInvitation(id, portal_base_url, request.user.userId)

  sendSuccess(reply, result, 'Invitation email sent successfully')
}

export async function linkToEmployeeRequest(
  request: FastifyRequest<{ Params: IdParam; Body: { employee_request_id: number; job_title_id: number } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { employee_request_id, job_title_id } = request.body

  const candidate = await candidateService.linkToEmployeeRequest(id, employee_request_id, job_title_id)
  const transformed = transformCandidate(candidate)

  sendSuccess(reply, transformed, 'Candidate linked to employee request successfully')
}

// ==================== Assessment Endpoints ====================

export async function getAssessmentProgress(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const progress = await candidateService.getAssessmentProgress(id)

  sendSuccess(reply, progress)
}

export async function startAssessment(
  request: FastifyRequest<{ Params: IdParam; Body: StartAssessmentBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { interview_date, interview_type } = request.body

  const progress = await candidateService.startAssessment(id, interview_date, interview_type)

  sendSuccess(reply, progress, 'Assessment started successfully')
}

export async function updateInterview1(
  request: FastifyRequest<{ Params: IdParam; Body: InterviewUpdateBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { status, description, scoring, conclusion, key_competencies, interviewer_notes, assessed_by, assessor_ids } = request.body

  const scoringPayload = scoring && conclusion ? {
    scoring: {
      relevanceOfExperience: scoring.relevance_of_experience,
      trainingUndertaken: scoring.training_undertaken,
      technicalSkills: scoring.technical_skills,
      nonTechnicalSkills: scoring.non_technical_skills,
      communicationSkills: scoring.communication_skills,
      emotionalMaturity: scoring.emotional_maturity,
      understandingOfPosition: scoring.understanding_of_position,
      teamworkAbility: scoring.teamwork_ability,
    },
    conclusion,
    keyCompetencies: key_competencies,
    interviewerNotes: interviewer_notes,
    assessedBy: assessed_by,
    assessorIds: assessor_ids,
  } : undefined

  const progress = await candidateService.updateInterview1(id, status as AssessmentStatus, description, scoringPayload)

  sendSuccess(reply, progress, 'Interview HR updated successfully')
}

export async function updateInterview2(
  request: FastifyRequest<{ Params: IdParam; Body: InterviewUpdateBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { status, description, scoring, conclusion, key_competencies, interviewer_notes, assessed_by } = request.body

  const scoringPayload = scoring && conclusion ? {
    scoring: {
      relevanceOfExperience: scoring.relevance_of_experience,
      trainingUndertaken: scoring.training_undertaken,
      technicalSkills: scoring.technical_skills,
      nonTechnicalSkills: scoring.non_technical_skills,
      communicationSkills: scoring.communication_skills,
      emotionalMaturity: scoring.emotional_maturity,
      understandingOfPosition: scoring.understanding_of_position,
      teamworkAbility: scoring.teamwork_ability,
    },
    conclusion,
    keyCompetencies: key_competencies,
    interviewerNotes: interviewer_notes,
    assessedBy: assessed_by,
  } : undefined

  const progress = await candidateService.updateInterview2(id, status as AssessmentStatus, description, scoringPayload)

  sendSuccess(reply, progress, 'Interview User updated successfully')
}

export async function scheduleMcu(
  request: FastifyRequest<{ Params: IdParam; Body: ScheduleMcuBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { mcu_date, mcu_location } = request.body

  const progress = await candidateService.scheduleMcu(id, mcu_date, mcu_location)

  sendSuccess(reply, progress, 'MCU scheduled successfully')
}

type McuUpdateBody = AssessmentUpdateBody & {
  document_url?: string | null
  document_name?: string | null
}

export async function updateMcu(
  request: FastifyRequest<{ Params: IdParam; Body: McuUpdateBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { status, description, document_url, document_name } = request.body

  const progress = await candidateService.updateMcu(
    id,
    status as AssessmentStatus,
    description,
    document_url,
    document_name
  )

  sendSuccess(reply, progress, 'MCU updated successfully')
}

const ALLOWED_MCU_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
]
const MAX_MCU_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadMcuDocument(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const file = await request.file()
  if (!file) {
    reply.status(400).send({ success: false, message: 'No file uploaded' })
    return
  }

  // Validate file type
  if (!ALLOWED_MCU_TYPES.includes(file.mimetype)) {
    reply.status(400).send({
      success: false,
      message: `Invalid file type. Allowed: PDF, JPEG, PNG`
    })
    return
  }

  // Read file buffer
  const chunks: Buffer[] = []
  for await (const chunk of file.file) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  // Validate file size
  if (buffer.length > MAX_MCU_FILE_SIZE) {
    reply.status(400).send({
      success: false,
      message: `File too large. Maximum size: 10MB`
    })
    return
  }

  const result = await candidateService.uploadMcuDocument(
    id,
    buffer,
    file.filename,
    file.mimetype
  )

  sendSuccess(reply, result, 'MCU document uploaded successfully')
}

export async function getMcuDocument(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const document = await candidateService.getMcuDocument(id)

  sendSuccess(reply, document)
}

export async function deleteMcuDocument(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await candidateService.deleteMcuDocument(id)

  sendSuccess(reply, null, 'MCU document deleted successfully')
}

// ==================== Assessment Scoring Endpoints ====================

export async function getAssessmentScoring(
  request: FastifyRequest<{ Params: IdParam; Querystring: ScoringQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { stage } = request.query

  const stageMap: Record<string, 'INTERVIEW1' | 'INTERVIEW2'> = {
    interview1: 'INTERVIEW1',
    interview2: 'INTERVIEW2',
  }

  const mappedStage = stage ? stageMap[stage] : undefined
  const scoring = await candidateService.getAssessmentScoring(id, mappedStage)

  sendSuccess(reply, scoring)
}

export async function getAssessmentAssignees(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const assignees = await candidateService.getAssessmentAssignees(id)

  sendSuccess(reply, assignees)
}

// ==================== Onboarding Endpoints ====================

export async function getOnboarding(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const onboarding = await candidateService.getOnboarding(id)

  if (!onboarding) {
    sendSuccess(reply, null)
    return
  }

  // Enrich facility and program PICs with employee info
  const facilities = await Promise.all(
    (onboarding.facilities || []).map(async (f) => ({
      id: Number(f.id),
      inventory_no: f.inventory_no,
      item: f.item,
      qty: f.qty,
      unit: f.unit,
      condition: f.condition,
      status: f.status,
      pics: await enrichPics(f.pics || [])
    }))
  )

  const programs = await Promise.all(
    (onboarding.programs || []).map(async (p) => ({
      id: Number(p.id),
      program: p.program,
      date: p.date,
      location: p.location,
      pic_legacy: p.pic_legacy,
      status: p.status,
      pics: await enrichPics(p.pics || [])
    }))
  )

  sendSuccess(reply, {
    id: Number(onboarding.id),
    candidate_id: onboarding.candidate_id,
    employee_request_id: onboarding.employee_request_id,
    job_placement: onboarding.job_placement,
    document: onboarding.document,
    document_candidate: onboarding.document_candidate,
    join_date: onboarding.join_date || null,
    onboarding_accepted_at: onboarding.onboardingAcceptedAt?.toISOString() || null,
    onboarding_sent_at: onboarding.onboardingSentAt?.toISOString() || null,
    facilities,
    programs
  })
}

export async function createOnboarding(
  request: FastifyRequest<{ Params: IdParam; Body: OnboardingBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { job_placement } = request.body

  const onboarding = await candidateService.createOnboarding(id, { jobPlacement: job_placement })

  sendSuccess(reply, {
    id: Number(onboarding.id),
    candidate_id: onboarding.candidate_id,
    job_placement: onboarding.job_placement
  }, 'Onboarding created successfully', 201)
}

export async function updateOnboarding(
  request: FastifyRequest<{ Params: IdParam; Body: OnboardingBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { job_placement, document, document_candidate, join_date } = request.body

  const onboarding = await candidateService.updateOnboarding(id, {
    jobPlacement: job_placement,
    document,
    documentCandidate: document_candidate,
    joinDate: join_date
  })

  sendSuccess(reply, {
    id: Number(onboarding.id),
    candidate_id: onboarding.candidate_id,
    job_placement: onboarding.job_placement,
    document: onboarding.document,
    document_candidate: onboarding.document_candidate
  }, 'Onboarding updated successfully')
}

type SendOnboardingBody = {
  portal_base_url: string
  join_date?: string
  work_location?: string
}

export async function sendOnboarding(
  request: FastifyRequest<{ Params: IdParam; Body: SendOnboardingBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { portal_base_url, join_date, work_location } = request.body

  const params: { joinDate?: string; workLocation?: string } = {}
  if (join_date) params.joinDate = join_date
  if (work_location) params.workLocation = work_location

  await candidateService.sendOnboardingEmail(id, portal_base_url, params)

  sendSuccess(reply, { success: true }, 'Onboarding email sent successfully')
}

// ==================== Facility Endpoints ====================

export async function addFacility(
  request: FastifyRequest<{ Params: IdParam; Body: FacilityBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { item, qty, unit, condition, status, pic_employee_ids } = request.body

  const facility = await candidateService.addFacility(id, {
    item,
    qty,
    unit,
    condition,
    status,
    pic_employee_ids: pic_employee_ids || []
  })

  sendSuccess(reply, {
    id: Number(facility.id),
    inventory_no: facility.inventory_no,
    item: facility.item,
    qty: facility.qty,
    unit: facility.unit,
    condition: facility.condition,
    status: facility.status,
    pics: await enrichPics(facility.pics || [])
  }, 'Facility added successfully', 201)
}

export async function updateFacility(
  request: FastifyRequest<{ Params: { id: number; facilityId: number }; Body: Partial<FacilityBody> }>,
  reply: FastifyReply
): Promise<void> {
  const { facilityId } = request.params
  const { item, qty, unit, condition, status, pic_employee_ids } = request.body

  const facility = await candidateService.updateFacility(facilityId, {
    ...(item && { item }),
    ...(qty !== undefined && { qty }),
    ...(unit && { unit }),
    ...(condition && { condition }),
    ...(status && { status }),
    ...(pic_employee_ids !== undefined && { pic_employee_ids })
  })

  sendSuccess(reply, {
    id: Number(facility.id),
    inventory_no: facility.inventory_no,
    item: facility.item,
    qty: facility.qty,
    unit: facility.unit,
    condition: facility.condition,
    status: facility.status,
    pics: await enrichPics(facility.pics || [])
  }, 'Facility updated successfully')
}

export async function deleteFacility(
  request: FastifyRequest<{ Params: { id: number; facilityId: number } }>,
  reply: FastifyReply
): Promise<void> {
  const { facilityId } = request.params

  await candidateService.deleteFacility(facilityId)

  reply.status(204).send()
}

// ==================== Program Endpoints ====================

export async function addProgram(
  request: FastifyRequest<{ Params: IdParam; Body: ProgramBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { program, date, location, pic_employee_ids, status } = request.body

  const prog = await candidateService.addProgram(id, {
    program,
    date,
    location,
    pic_employee_ids: pic_employee_ids || [],
    status
  })

  sendSuccess(reply, {
    id: Number(prog.id),
    program: prog.program,
    date: prog.date,
    location: prog.location,
    pic_legacy: prog.pic_legacy,
    status: prog.status,
    pics: await enrichPics(prog.pics || [])
  }, 'Program added successfully', 201)
}

export async function updateProgram(
  request: FastifyRequest<{ Params: { id: number; programId: number }; Body: Partial<ProgramBody> }>,
  reply: FastifyReply
): Promise<void> {
  const { programId } = request.params
  const { program, date, location, pic_employee_ids, status } = request.body

  const prog = await candidateService.updateProgram(programId, {
    ...(program && { program }),
    ...(date && { date }),
    ...(location && { location }),
    ...(pic_employee_ids !== undefined && { pic_employee_ids }),
    ...(status && { status })
  })

  sendSuccess(reply, {
    id: Number(prog.id),
    program: prog.program,
    date: prog.date,
    location: prog.location,
    pic_legacy: prog.pic_legacy,
    status: prog.status,
    pics: await enrichPics(prog.pics || [])
  }, 'Program updated successfully')
}

export async function deleteProgram(
  request: FastifyRequest<{ Params: { id: number; programId: number } }>,
  reply: FastifyReply
): Promise<void> {
  const { programId } = request.params

  await candidateService.deleteProgram(programId)

  reply.status(204).send()
}

// ==================== Biodata Endpoints ====================

export async function getBiodata(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const candidateId = Number(id)

  // Fetch all biodata in parallel
  const [educationResult, workExperienceResult, familyResult, trainingResult, assessmentResult] = await Promise.all([
    candidateProfileRepository.findEducationByCandidateId(candidateId),
    candidateProfileRepository.findWorkExperienceByCandidateId(candidateId),
    candidateProfileRepository.findFamilyByCandidateId(candidateId),
    candidateProfileRepository.findTrainingByCandidateId(candidateId),
    candidateProfileRepository.findAssessmentByCandidateId(candidateId)
  ])

  // Transform education data
  const education = educationResult.isSuccess()
    ? educationResult.getValue().map(item => ({
        id: Number(item.id),
        school_university: item.school_university,
        city: item.city,
        degree: item.degree,
        major: item.major,
        year_graduate: item.year_graduate
      }))
    : []

  // Transform work experience data
  const workExperience = workExperienceResult.isSuccess()
    ? workExperienceResult.getValue().map(item => ({
        id: Number(item.id),
        company: item.company,
        city: item.city,
        job_title: item.job_title,
        period: item.period,
        length_of_working: item.length_of_working
      }))
    : []

  // Transform family data
  const family = familyResult.isSuccess()
    ? familyResult.getValue().map(item => ({
        id: Number(item.id),
        name: item.name,
        relation: item.relation,
        age: item.age,
        education: item.education,
        work: item.work
      }))
    : []

  // Transform training/course data
  const training = trainingResult.isSuccess()
    ? trainingResult.getValue().map(item => ({
        id: Number(item.id),
        course_topic: item.course_topic,
        provider: item.provider,
        year: item.year,
        city: item.city,
        certificate: item.certificate
      }))
    : []

  // Transform self assessment data
  const assessmentData = assessmentResult.isSuccess() ? assessmentResult.getValue() : null
  const selfAssessment = assessmentData
    ? {
        id: Number(assessmentData.id),
        reason_leaving_last_job: assessmentData.reason_to_move,
        last_job_description: assessmentData.last_job_description,
        reason_applying: assessmentData.purpose_of_applying,
        relevant_skills: assessmentData.tasks_jobs,
        last_salary: assessmentData.last_salary,
        expected_salary: assessmentData.expected_salary,
        active_language: assessmentData.active_language,
        willing_to_transfer: assessmentData.rotate_work,
        willing_to_double_work: assessmentData.loyality,
        known_employees: assessmentData.employees_you_know,
        ready_to_work: assessmentData.when_ready_work,
        employee_relationship: assessmentData.relationship_with_the_employee,
        reference_contact_name: assessmentData.ref_contact_name,
        reference_contact_phone: assessmentData.ref_mobile_phone
      }
    : null

  sendSuccess(reply, {
    education,
    work_experience: workExperience,
    family,
    training,
    self_assessment: selfAssessment
  })
}
