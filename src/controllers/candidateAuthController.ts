import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CandidateRecruitment } from '@prisma/client'

import * as candidateAuthService from '../services/candidateAuthService.js'
import * as candidateService from '../services/candidateService.js'
import { successResponse } from '../utils/response.js'
import type { CandidateLoginBody, CandidateProfileUpdate } from '../schemas/candidateAuthSchemas.js'
import { UnauthorizedError } from '../errors/index.js'

// Transform candidate data for API response (snake_case)
function transformCandidate(candidate: CandidateRecruitment & { candidateCode?: string }) {
  return {
    id: Number(candidate.id),
    fullname: candidate.fullname,
    email: candidate.email,
    address: candidate.address,
    resident_status: candidate.resident_status,
    birth_place: candidate.birth_place,
    birth_date: candidate.birth_date?.toISOString().split('T')[0] || null,
    religion: candidate.religion,
    ethnic_group: candidate.ethnic_group,
    id_no: candidate.id_no,
    tax_id: candidate.tax_id,
    bpjs_id: candidate.bpjs_id,
    citizenship: candidate.citizenship,
    marrital_status: candidate.marrital_status,
    gender: candidate.gender,
    mobile_phone: candidate.mobile_phone,
    domicile_address: candidate.domicile_address || '',
    driving_license: candidate.driving_license,
    uniform_shirt_size: candidate.uniform_shirt_size || '',
    uniform_pants_size: candidate.uniform_pants_size || '',
    verify: candidate.verify,
    agreement_accepted_at: candidate.agreementAcceptedAt?.toISOString() || null,
    agreement_version: candidate.agreementVersion || null,
    created_at: candidate.createdAt?.toISOString() || null,
    updated_at: candidate.updatedAt?.toISOString() || null,
    candidate_code: candidate.candidateCode || null
  }
}

export async function login(
  request: FastifyRequest<{ Body: CandidateLoginBody }>,
  reply: FastifyReply
): Promise<void> {
  const result = await candidateAuthService.login(request.body)

  return reply.status(200).send(
    successResponse({
      candidate: transformCandidate(result.candidate),
      token: result.token
    })
  )
}

export async function verifyPassword(
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { email, password } = request.body
  const isValid = await candidateAuthService.verifyPassword(email, password)

  return reply.status(200).send(
    successResponse({ valid: isValid })
  )
}

export async function getProfile(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const candidate = await candidateAuthService.getProfile(request.candidate.candidateId)
  const transformed = transformCandidate(candidate)

  // Debug: Log transformed response
  console.log('[DEBUG] getProfile - transformed response:', {
    uniform_shirt_size: transformed.uniform_shirt_size,
    uniform_pants_size: transformed.uniform_pants_size,
    domicile_address: transformed.domicile_address,
    driving_license: transformed.driving_license,
  })

  return reply.status(200).send(
    successResponse(transformed)
  )
}

export async function updateProfile(
  request: FastifyRequest<{ Body: CandidateProfileUpdate }>,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const candidate = await candidateAuthService.updateProfile(
    request.candidate.candidateId,
    request.body
  )

  return reply.status(200).send(
    successResponse(transformCandidate(candidate))
  )
}

export async function acceptAgreement(
  request: FastifyRequest<{ Body: { version?: string } }>,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const candidate = await candidateAuthService.acceptAgreement(
    request.candidate.candidateId,
    request.body.version
  )

  return reply.status(200).send(
    successResponse(transformCandidate({ ...candidate, candidateCode: undefined }))
  )
}

export async function acceptOnboarding(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const onboarding = await candidateService.acceptOnboarding(request.candidate.candidateId)

  return reply.status(200).send(
    successResponse({
      id: Number(onboarding.id),
      candidateId: onboarding.candidate_id,
      employeeRequestId: onboarding.employee_request_id,
      jobPlacement: onboarding.job_placement,
      document: onboarding.document,
      documentCandidate: onboarding.document_candidate,
      onboardingAcceptedAt: onboarding.onboardingAcceptedAt?.toISOString() || null,
      facilities: onboarding.facilities?.map(f => ({
        id: Number(f.id),
        inventoryNo: f.inventory_no,
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
  )
}
