import jwt from 'jsonwebtoken'
import type { CandidateRecruitment } from '@prisma/client'

import { JWT_CONFIG } from '../config/jwt.js'
import { AppError, UnauthorizedError, NotFoundError } from '../errors/index.js'
import * as candidateRepository from '../repositories/candidateRepository.js'
import type { CandidateLoginBody, CandidateProfileUpdate } from '../schemas/candidateAuthSchemas.js'
import type { CandidateJwtPayload } from '../middlewares/candidateAuthMiddleware.js'

export interface CandidateAuthResult {
  candidate: CandidateRecruitment
  token: string
}

const CANDIDATE_TOKEN_EXPIRES_IN = '24h' // Shorter lifespan for candidate tokens

export async function login(data: CandidateLoginBody): Promise<CandidateAuthResult> {
  // Find candidate by email first
  const emailResult = await candidateRepository.findByEmail(data.email)

  if (emailResult.isFailure()) {
    throw new AppError(500, emailResult.error)
  }

  const candidate = emailResult.getValue()

  if (!candidate) {
    throw new UnauthorizedError('Invalid email or token')
  }

  // Verify token matches
  if (!candidate.token || candidate.token !== data.token) {
    throw new UnauthorizedError('Invalid email or token')
  }

  // Mark as verified on first login
  if (candidate.verify === 'NOT_VERIFIED') {
    await candidateRepository.verifyCandidate(Number(candidate.id))
  }

  // Generate JWT
  const jwtToken = generateCandidateToken({
    candidateId: Number(candidate.id),
    email: candidate.email,
    type: 'candidate'
  })

  return { candidate, token: jwtToken }
}

export async function verifyToken(email: string, token: string): Promise<boolean> {
  const result = await candidateRepository.findByEmail(email)

  if (result.isFailure()) {
    return false
  }

  const candidate = result.getValue()

  if (!candidate) {
    return false
  }

  if (!candidate.token || candidate.token !== token) {
    return false
  }

  return true
}

export async function getProfile(candidateId: number): Promise<CandidateRecruitment> {
  const result = await candidateRepository.findById(candidateId)

  if (result.isFailure()) {
    throw new AppError(500, result.error)
  }

  const candidate = result.getValue()

  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  return candidate
}

export async function updateProfile(
  candidateId: number,
  data: CandidateProfileUpdate
): Promise<CandidateRecruitment> {
  // First check if candidate exists
  const existingResult = await candidateRepository.findById(candidateId)

  if (existingResult.isFailure()) {
    throw new AppError(500, existingResult.error)
  }

  if (!existingResult.getValue()) {
    throw new NotFoundError('Candidate not found')
  }

  // Map from profile update to repository format
  const updateData: candidateRepository.UpdateCandidateData = {}

  if (data.fullname !== undefined) updateData.fullname = data.fullname
  if (data.address !== undefined) updateData.address = data.address
  if (data.mobilePhone !== undefined) updateData.mobilePhone = data.mobilePhone
  if (data.birthPlace !== undefined) updateData.birthPlace = data.birthPlace
  if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate)
  if (data.religion !== undefined) updateData.religion = data.religion
  if (data.ethnicGroup !== undefined) updateData.ethnicGroup = data.ethnicGroup
  if (data.idNo !== undefined) updateData.idNo = data.idNo
  if (data.taxId !== undefined) updateData.taxId = data.taxId
  if (data.bpjsId !== undefined) updateData.bpjsId = data.bpjsId
  if (data.citizenship !== undefined) updateData.citizenship = data.citizenship
  if (data.marritalStatus !== undefined) updateData.marritalStatus = data.marritalStatus
  if (data.drivingLicense !== undefined) updateData.drivingLicense = data.drivingLicense

  const result = await candidateRepository.update(candidateId, updateData)

  if (result.isFailure()) {
    throw new AppError(500, result.error)
  }

  return result.getValue()
}

function generateCandidateToken(payload: CandidateJwtPayload): string {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: CANDIDATE_TOKEN_EXPIRES_IN
  })
}
