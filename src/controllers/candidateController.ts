import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import * as candidateService from '../services/candidateService.js'
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

type OnboardingBody = {
  job_placement?: string
  document?: string
  document_candidate?: string
}

type FacilityBody = {
  inventory_no: string
  item: string
  qty: number
  unit: string
  condition: string
  status: string
}

type ProgramBody = {
  program: string
  date: string
  location: string
  pic: string
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
      code: candidate.employeeRequest.code
    } : null
  }
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

  const result = await candidateService.sendCandidateInvitation(id, portal_base_url)

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

export async function updateInterview1(
  request: FastifyRequest<{ Params: IdParam; Body: AssessmentUpdateBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { status, description } = request.body

  const progress = await candidateService.updateInterview1(id, status as AssessmentStatus, description)

  sendSuccess(reply, progress, 'Interview 1 updated successfully')
}

export async function updateInterview2(
  request: FastifyRequest<{ Params: IdParam; Body: AssessmentUpdateBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { status, description } = request.body

  const progress = await candidateService.updateInterview2(id, status as AssessmentStatus, description)

  sendSuccess(reply, progress, 'Interview 2 updated successfully')
}

export async function updateMcu(
  request: FastifyRequest<{ Params: IdParam; Body: AssessmentUpdateBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { status, description } = request.body

  const progress = await candidateService.updateMcu(id, status as AssessmentStatus, description)

  sendSuccess(reply, progress, 'MCU updated successfully')
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

  sendSuccess(reply, {
    id: Number(onboarding.id),
    candidate_id: onboarding.candidate_id,
    employee_request_id: onboarding.employee_request_id,
    job_placement: onboarding.job_placement,
    document: onboarding.document,
    document_candidate: onboarding.document_candidate,
    facilities: onboarding.facilities?.map(f => ({
      id: Number(f.id),
      inventory_no: f.inventory_no,
      item: f.item,
      qty: f.qty,
      unit: f.unit,
      condition: f.condition,
      status: f.status
    })) || [],
    programs: onboarding.programs?.map(p => ({
      id: Number(p.id),
      program: p.program,
      date: p.date,
      location: p.location,
      pic: p.pic,
      status: p.status
    })) || []
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
  const { job_placement, document, document_candidate } = request.body

  const onboarding = await candidateService.updateOnboarding(id, {
    jobPlacement: job_placement,
    document,
    documentCandidate: document_candidate
  })

  sendSuccess(reply, {
    id: Number(onboarding.id),
    candidate_id: onboarding.candidate_id,
    job_placement: onboarding.job_placement,
    document: onboarding.document,
    document_candidate: onboarding.document_candidate
  }, 'Onboarding updated successfully')
}

// ==================== Facility Endpoints ====================

export async function addFacility(
  request: FastifyRequest<{ Params: IdParam; Body: FacilityBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { inventory_no, item, qty, unit, condition, status } = request.body

  const facility = await candidateService.addFacility(id, {
    inventoryNo: inventory_no,
    item,
    qty,
    unit,
    condition,
    status
  })

  sendSuccess(reply, {
    id: Number(facility.id),
    inventory_no: facility.inventory_no,
    item: facility.item,
    qty: facility.qty,
    unit: facility.unit,
    condition: facility.condition,
    status: facility.status
  }, 'Facility added successfully', 201)
}

export async function updateFacility(
  request: FastifyRequest<{ Params: { id: number; facilityId: number }; Body: Partial<FacilityBody> }>,
  reply: FastifyReply
): Promise<void> {
  const { facilityId } = request.params
  const { inventory_no, item, qty, unit, condition, status } = request.body

  const facility = await candidateService.updateFacility(facilityId, {
    ...(inventory_no && { inventoryNo: inventory_no }),
    ...(item && { item }),
    ...(qty !== undefined && { qty }),
    ...(unit && { unit }),
    ...(condition && { condition }),
    ...(status && { status })
  })

  sendSuccess(reply, {
    id: Number(facility.id),
    inventory_no: facility.inventory_no,
    item: facility.item,
    qty: facility.qty,
    unit: facility.unit,
    condition: facility.condition,
    status: facility.status
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
  const { program, date, location, pic, status } = request.body

  const prog = await candidateService.addProgram(id, {
    program,
    date,
    location,
    pic,
    status
  })

  sendSuccess(reply, {
    id: Number(prog.id),
    program: prog.program,
    date: prog.date,
    location: prog.location,
    pic: prog.pic,
    status: prog.status
  }, 'Program added successfully', 201)
}

export async function updateProgram(
  request: FastifyRequest<{ Params: { id: number; programId: number }; Body: Partial<ProgramBody> }>,
  reply: FastifyReply
): Promise<void> {
  const { programId } = request.params
  const { program, date, location, pic, status } = request.body

  const prog = await candidateService.updateProgram(programId, {
    ...(program && { program }),
    ...(date && { date }),
    ...(location && { location }),
    ...(pic && { pic }),
    ...(status && { status })
  })

  sendSuccess(reply, {
    id: Number(prog.id),
    program: prog.program,
    date: prog.date,
    location: prog.location,
    pic: prog.pic,
    status: prog.status
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

// ==================== Convert to Employee ====================

export async function convertToEmployee(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const result = await candidateService.convertToEmployee(id)

  sendSuccess(reply, result, 'Candidate converted to employee successfully')
}
