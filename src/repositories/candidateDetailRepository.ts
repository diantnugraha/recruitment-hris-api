import type { candidate_recruitment_detail, Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'

import { prisma } from '../config/database.js'
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
    const candidateToken = randomBytes(32).toString('hex')

    const detail = await prisma.candidate_recruitment_detail.create({
      data: {
        candidate_id: data.candidateId,
        job_title_id: data.jobTitleId,
        employee_request_id: String(data.employeeRequestId),
        candidate_code: candidateCode,
        candidate_token: candidateToken,
        candidate_verify: 'NOT_VERIFIED'
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
      data: { candidate_verify: 'VERIFIED' }
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
