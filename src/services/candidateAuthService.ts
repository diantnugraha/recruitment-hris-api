import jwt from 'jsonwebtoken'
import type { CandidateRecruitment } from '@prisma/client'

import { JWT_CONFIG } from '../config/jwt.js'
import { AppError, UnauthorizedError, NotFoundError } from '../errors/index.js'
import * as candidateRepository from '../repositories/candidateRepository.js'
import * as candidateDetailRepository from '../repositories/candidateDetailRepository.js'
import type { CandidateLoginBody, CandidateProfileUpdate } from '../schemas/candidateAuthSchemas.js'
import type { CandidateJwtPayload } from '../middlewares/candidateAuthMiddleware.js'

export interface CandidateAuthResult {
  candidate: CandidateRecruitment & { candidateCode?: string }
  token: string
}

const CANDIDATE_TOKEN_EXPIRES_IN = '24h' // Shorter lifespan for candidate tokens

export async function login(data: CandidateLoginBody): Promise<CandidateAuthResult> {
  // Find candidate by email with detail
  const result = await candidateDetailRepository.findByEmailWithDetail(data.email)

  if (result.isFailure()) {
    throw new AppError(500, result.error)
  }

  const { candidate, detail } = result.getValue()

  if (!candidate) {
    throw new UnauthorizedError('Invalid email or password')
  }

  if (!detail) {
    throw new UnauthorizedError('Account not found. Please contact HR.')
  }

  // Verify password using bcrypt
  if (!detail.candidate_token) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const verifyResult = await candidateDetailRepository.verifyPassword(Number(candidate.id), data.password)
  if (verifyResult.isFailure()) {
    throw new AppError(500, verifyResult.error)
  }

  if (!verifyResult.getValue()) {
    throw new UnauthorizedError('Invalid email or password')
  }

  // Get full candidate record
  const fullCandidateResult = await candidateRepository.findByEmail(data.email)
  if (fullCandidateResult.isFailure()) {
    throw new AppError(500, fullCandidateResult.error)
  }

  const fullCandidate = fullCandidateResult.getValue()
  if (!fullCandidate) {
    throw new UnauthorizedError('Invalid email or password')
  }

  // Mark as verified on first login
  if (fullCandidate.verify === 'NOT_VERIFIED') {
    await candidateRepository.verifyCandidate(Number(fullCandidate.id))
  }

  // Generate JWT
  const jwtToken = generateCandidateToken({
    candidateId: Number(fullCandidate.id),
    email: fullCandidate.email,
    type: 'candidate'
  })

  // Include candidate_code from detail
  const candidateWithCode = {
    ...fullCandidate,
    candidateCode: detail.candidate_code
  }

  return { candidate: candidateWithCode, token: jwtToken }
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const result = await candidateDetailRepository.findByEmailWithDetail(email)

  if (result.isFailure()) {
    return false
  }

  const { candidate, detail } = result.getValue()

  if (!candidate || !detail) {
    return false
  }

  if (!detail.candidate_token) {
    return false
  }

  const verifyResult = await candidateDetailRepository.verifyPassword(Number(candidate.id), password)
  if (verifyResult.isFailure()) {
    return false
  }

  return verifyResult.getValue()
}

export async function getProfile(candidateId: number): Promise<CandidateRecruitment & { candidateCode?: string }> {
  const result = await candidateRepository.findById(candidateId)

  if (result.isFailure()) {
    throw new AppError(500, result.error)
  }

  const candidate = result.getValue()

  if (!candidate) {
    throw new NotFoundError('Candidate not found')
  }

  // Debug: Log candidate data from repository
  console.log('[DEBUG] getProfile - candidate from DB:', {
    uniform_shirt_size: candidate.uniform_shirt_size,
    uniform_pants_size: candidate.uniform_pants_size,
    domicile_address: candidate.domicile_address,
    driving_license: candidate.driving_license,
  })

  // Get candidate code from detail
  const detailResult = await candidateDetailRepository.findByEmailWithDetail(candidate.email)
  let candidateCode: string | undefined

  if (detailResult.isSuccess()) {
    const { detail } = detailResult.getValue()
    candidateCode = detail?.candidate_code || undefined
  }

  return { ...candidate, candidateCode }
}

export async function updateProfile(
  candidateId: number,
  data: CandidateProfileUpdate
): Promise<CandidateRecruitment> {
  // Debug: Log incoming data
  console.log('[DEBUG] updateProfile - incoming data:', JSON.stringify(data, null, 2))
  console.log('[DEBUG] updateProfile - uniformShirtSize:', data.uniformShirtSize)
  console.log('[DEBUG] updateProfile - uniformPantsSize:', data.uniformPantsSize)
  console.log('[DEBUG] updateProfile - domicileAddress:', data.domicileAddress)

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
  if (data.residentStatus !== undefined) updateData.residentStatus = data.residentStatus
  if (data.domicileAddress !== undefined) updateData.domicileAddress = data.domicileAddress
  if (data.drivingLicense !== undefined) updateData.drivingLicense = data.drivingLicense
  if (data.uniformShirtSize !== undefined) updateData.uniformShirtSize = data.uniformShirtSize
  if (data.uniformPantsSize !== undefined) updateData.uniformPantsSize = data.uniformPantsSize

  // Debug: Log updateData before calling repository
  console.log('[DEBUG] updateProfile - updateData:', JSON.stringify(updateData, null, 2))

  const result = await candidateRepository.update(candidateId, updateData)

  if (result.isFailure()) {
    throw new AppError(500, result.error)
  }

  return result.getValue()
}

export async function acceptAgreement(
  candidateId: number,
  version?: string
): Promise<CandidateRecruitment> {
  const result = await candidateRepository.acceptAgreement(candidateId, version)

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
