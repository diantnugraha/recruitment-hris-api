import type { candidate_recruitment_detail, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { prisma } from '../config/database.js'
import { AUTH_CONSTANTS } from '../constants/authConstants.js'
import { type RepositoryResult, success, failure } from './types.js'

export type CreateDetailData = {
  candidateId: number
  jobTitleId: number
  employeeRequestId: number
}

export type UpdateDetailData = {
  jobTitleId?: number
  employeeRequestId?: number
  candidateVerify?: boolean
}

// Generate candidate code: AP.YYMMDDXXXX (sequential per day)
async function generateCandidateCode(): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const prefix = `AP.${yy}${mm}${dd}`

  const count = await prisma.candidate_recruitment_detail.count({
    where: { candidate_code: { startsWith: prefix } }
  })

  return `${prefix}${String(count + 1).padStart(4, '0')}`
}

export async function findById(id: number): Promise<RepositoryResult<candidate_recruitment_detail | null>> {
  try {
    const detail = await prisma.candidate_recruitment_detail.findUnique({
      where: { id: BigInt(id) }
    })
    return success(detail)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find candidate detail'
    return failure(message)
  }
}

export async function findByCandidateId(candidateId: number): Promise<RepositoryResult<candidate_recruitment_detail | null>> {
  try {
    const detail = await prisma.candidate_recruitment_detail.findFirst({
      where: { candidate_id: candidateId }
    })
    return success(detail)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find candidate detail'
    return failure(message)
  }
}

export async function findByEmployeeRequestId(employeeRequestId: number): Promise<RepositoryResult<candidate_recruitment_detail[]>> {
  try {
    const details = await prisma.candidate_recruitment_detail.findMany({
      where: { employee_request_id: String(employeeRequestId) }
    })
    return success(details)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find details by employee request'
    return failure(message)
  }
}

export async function findByToken(token: string): Promise<RepositoryResult<candidate_recruitment_detail | null>> {
  try {
    const detail = await prisma.candidate_recruitment_detail.findFirst({
      where: { candidate_token: token }
    })
    return success(detail)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find detail by token'
    return failure(message)
  }
}

export async function create(data: CreateDetailData): Promise<RepositoryResult<candidate_recruitment_detail>> {
  try {
    const candidateCode = await generateCandidateCode()
    // Placeholder token - will be set when invitation is sent
    const candidateToken = ''

    const detail = await prisma.candidate_recruitment_detail.create({
      data: {
        candidate_id: data.candidateId,
        job_title_id: data.jobTitleId,
        employee_request_id: String(data.employeeRequestId),
        candidate_code: candidateCode,
        candidate_token: candidateToken,
        candidate_verify: 'NOT_VERIFIED',
        createdAt: new Date()
      }
    })

    return success(detail)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create candidate detail'
    return failure(message)
  }
}

export async function update(
  id: number,
  data: UpdateDetailData
): Promise<RepositoryResult<candidate_recruitment_detail>> {
  try {
    const updateData: Prisma.candidate_recruitment_detailUpdateInput = {}

    if (data.jobTitleId !== undefined) updateData.job_title_id = data.jobTitleId
    if (data.employeeRequestId !== undefined) updateData.employee_request_id = String(data.employeeRequestId)
    if (data.candidateVerify !== undefined) {
      updateData.candidate_verify = data.candidateVerify ? 'VERIFIED' : 'NOT_VERIFIED'
    }
    updateData.updatedAt = new Date()

    const detail = await prisma.candidate_recruitment_detail.update({
      where: { id: BigInt(id) },
      data: updateData
    })

    return success(detail)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update candidate detail'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidate_recruitment_detail.delete({
      where: { id: BigInt(id) }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete candidate detail'
    return failure(message)
  }
}

export async function removeByCandidateId(candidateId: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidate_recruitment_detail.deleteMany({
      where: { candidate_id: candidateId }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete candidate details'
    return failure(message)
  }
}

export async function verifyCandidate(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidate_recruitment_detail.update({
      where: { id: BigInt(id) },
      data: { candidate_verify: 'VERIFIED', updatedAt: new Date() }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify candidate'
    return failure(message)
  }
}

export async function countByEmployeeRequestId(employeeRequestId: number): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.candidate_recruitment_detail.count({
      where: { employee_request_id: String(employeeRequestId) }
    })
    return success(count)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to count candidates'
    return failure(message)
  }
}

export async function setPassword(candidateId: number, password: string): Promise<RepositoryResult<boolean>> {
  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_ROUNDS)

    // Use raw SQL to set created_at without triggering updated_at
    await prisma.$executeRaw`
      UPDATE candidate_recruitment_detail
      SET candidate_token = ${hashedPassword}, created_at = NOW()
      WHERE candidate_id = ${candidateId}
    `
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set password'
    return failure(message)
  }
}

export async function findByEmailWithDetail(email: string): Promise<RepositoryResult<{
  candidate: { id: bigint; email: string; fullname: string; verify: string } | null
  detail: candidate_recruitment_detail | null
}>> {
  try {
    const candidate = await prisma.candidateRecruitment.findFirst({
      where: { email },
      select: { id: true, email: true, fullname: true, verify: true }
    })

    if (!candidate) {
      return success({ candidate: null, detail: null })
    }

    const detail = await prisma.candidate_recruitment_detail.findFirst({
      where: { candidate_id: Number(candidate.id) }
    })

    return success({ candidate, detail })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find candidate with detail'
    return failure(message)
  }
}

export async function verifyPassword(candidateId: number, password: string): Promise<RepositoryResult<boolean>> {
  try {
    const detail = await prisma.candidate_recruitment_detail.findFirst({
      where: { candidate_id: candidateId },
      select: { candidate_token: true }
    })

    if (!detail || !detail.candidate_token) {
      return success(false)
    }

    const isValid = await bcrypt.compare(password, detail.candidate_token)
    return success(isValid)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify password'
    return failure(message)
  }
}
