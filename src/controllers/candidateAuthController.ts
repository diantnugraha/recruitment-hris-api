import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CandidateRecruitment } from '@prisma/client'

import * as candidateAuthService from '../services/candidateAuthService.js'
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
    driving_license: candidate.driving_license,
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

  return reply.status(200).send(
    successResponse(transformCandidate(candidate))
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
