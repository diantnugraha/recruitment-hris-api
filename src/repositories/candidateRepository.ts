import type { CandidateRecruitment, candidate_recruitment_detail, candidate_recruitment_assessment, Prisma, CandidateVerify } from '@prisma/client'
import { randomBytes } from 'crypto'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type CandidateFilters = {
  name?: string
  email?: string
  verified?: boolean
  jobTitleId?: number
  employeeRequestId?: number
}

export type PaginationParams = {
  page: number
  limit: number
}

// Type for candidate with detail and assessment data
export type CandidateWithDetail = CandidateRecruitment & {
  detail?: candidate_recruitment_detail | null | undefined
  assessment?: candidate_recruitment_assessment | null | undefined
  onboarding?: {
    onboardingAcceptedAt: Date | null
    onboardingSentAt: Date | null
  } | null | undefined
  jobTitle?: {
    id: bigint
    name: string
  } | null | undefined
  employeeRequest?: {
    id: bigint
    code: string
    jobTitleId: bigint
    jobPlacement: string | null
  } | null | undefined
}

export type PaginatedResult = {
  items: CandidateWithDetail[]
  total: number
}

export type CreateCandidateData = {
  email: string
  fullname: string
  address?: string | undefined
  residentStatus?: string | undefined
  birthPlace?: string | undefined
  birthDate?: Date | undefined
  religion?: string | undefined
  ethnicGroup?: string | undefined
  idNo?: string | undefined
  taxId?: string | undefined
  bpjsId?: string | undefined
  citizenship?: string | undefined
  marritalStatus?: string | undefined
  gender?: 'M' | 'F' | undefined
  mobilePhone?: string | undefined
  domicileAddress?: string | undefined
  drivingLicense?: string | undefined
  uniformShirtSize?: string | undefined
  uniformPantsSize?: string | undefined
  // Link to employee request
  employeeRequestId?: number | undefined
  jobTitleId?: number | undefined
}

export type UpdateCandidateData = Partial<CreateCandidateData>

export async function findAll(
  filters: CandidateFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const page = Number(pagination.page)
    const limit = Number(pagination.limit)

    // If filtering by employeeRequestId, get candidate IDs from detail table first
    let candidateIdsFromRequest: number[] | null = null
    if (filters.employeeRequestId) {
      const details = await prisma.candidate_recruitment_detail.findMany({
        where: { employee_request_id: String(filters.employeeRequestId) },
        select: { candidate_id: true }
      })
      candidateIdsFromRequest = details.map(d => d.candidate_id)

      // If no candidates found for this employee request, return empty
      if (candidateIdsFromRequest.length === 0) {
        return success({ items: [], total: 0 })
      }
    }

    const where: Prisma.CandidateRecruitmentWhereInput = {
      ...(filters.name && {
        fullname: { contains: filters.name }
      }),
      ...(filters.email && { email: { contains: filters.email } }),
      ...(filters.verified !== undefined && {
        verify: filters.verified ? 'VERIFIED' as CandidateVerify : 'NOT_VERIFIED' as CandidateVerify
      }),
      // Filter by candidate IDs from employee request
      ...(candidateIdsFromRequest && {
        id: { in: candidateIdsFromRequest.map(id => BigInt(id)) }
      })
    }

    const [items, total] = await prisma.$transaction([
      prisma.candidateRecruitment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.candidateRecruitment.count({ where })
    ])

    // Fetch details and assessments for each candidate
    const candidatesWithRelations = await Promise.all(
      items.map(async (candidate) => {
        const detail = await prisma.candidate_recruitment_detail.findFirst({
          where: { candidate_id: Number(candidate.id) }
        })

        let assessment = null
        if (detail) {
          assessment = await prisma.candidate_recruitment_assessment.findFirst({
            where: {
              candidate_id: Number(candidate.id),
              candidate_recruitment_detail_id: Number(detail.id)
            }
          })
        }

        let jobTitle = null
        if (detail?.job_title_id) {
          jobTitle = await prisma.jobTitle.findUnique({
            where: { id: BigInt(detail.job_title_id) },
            select: { id: true, name: true }
          })
        }

        let employeeRequest = null
        if (detail?.employee_request_id) {
          employeeRequest = await prisma.employeeRequest.findUnique({
            where: { id: BigInt(detail.employee_request_id) },
            select: { id: true, code: true, jobTitleId: true, jobPlacement: true }
          })
        }

        return {
          ...candidate,
          detail,
          assessment,
          jobTitle,
          employeeRequest
        } as CandidateWithDetail
      })
    )

    return success({ items: candidatesWithRelations, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch candidates'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<CandidateWithDetail | null>> {
  try {
    const candidate = await prisma.candidateRecruitment.findUnique({
      where: { id: BigInt(id) }
    })

    if (!candidate) {
      return success(null)
    }

    // Fetch related detail
    const detail = await prisma.candidate_recruitment_detail.findFirst({
      where: { candidate_id: id }
    })

    // Fetch assessment
    let assessment = null
    if (detail) {
      assessment = await prisma.candidate_recruitment_assessment.findFirst({
        where: {
          candidate_id: id,
          candidate_recruitment_detail_id: Number(detail.id)
        }
      })
    }

    // Fetch job title
    let jobTitle = null
    if (detail?.job_title_id) {
      jobTitle = await prisma.jobTitle.findUnique({
        where: { id: BigInt(detail.job_title_id) },
        select: { id: true, name: true }
      })
    }

    // Fetch employee request
    let employeeRequest = null
    if (detail?.employee_request_id) {
      employeeRequest = await prisma.employeeRequest.findUnique({
        where: { id: BigInt(detail.employee_request_id) },
        select: { id: true, code: true, jobTitleId: true, jobPlacement: true }
      })
    }

    return success({
      ...candidate,
      detail,
      assessment,
      jobTitle,
      employeeRequest
    } as CandidateWithDetail)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find candidate by id'
    return failure(message)
  }
}

export async function findByEmail(email: string): Promise<RepositoryResult<CandidateRecruitment | null>> {
  try {
    const candidate = await prisma.candidateRecruitment.findFirst({
      where: { email }
    })
    return success(candidate)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find candidate by email'
    return failure(message)
  }
}

export async function findByToken(token: string): Promise<RepositoryResult<CandidateRecruitment | null>> {
  try {
    const candidate = await prisma.candidateRecruitment.findFirst({
      where: { token }
    })
    return success(candidate)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find candidate by token'
    return failure(message)
  }
}

export async function findByEmployeeRequestId(
  employeeRequestId: number,
  pagination?: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    // First, get all candidate details linked to this employee request
    const details = await prisma.candidate_recruitment_detail.findMany({
      where: { employee_request_id: String(employeeRequestId) }
    })

    const candidateIds = details.map(d => d.candidate_id)

    if (candidateIds.length === 0) {
      return success({ items: [], total: 0 })
    }

    const where: Prisma.CandidateRecruitmentWhereInput = {
      id: { in: candidateIds.map(id => BigInt(id)) }
    }

    const skip = pagination ? (Number(pagination.page) - 1) * Number(pagination.limit) : 0
    const take = pagination ? Number(pagination.limit) : 50

    const [items, total] = await prisma.$transaction([
      prisma.candidateRecruitment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.candidateRecruitment.count({ where })
    ])

    // Fetch details and assessments for each candidate
    const candidatesWithRelations = await Promise.all(
      items.map(async (candidate) => {
        const detail = details.find(d => d.candidate_id === Number(candidate.id))

        let assessment = null
        if (detail) {
          assessment = await prisma.candidate_recruitment_assessment.findFirst({
            where: {
              candidate_id: Number(candidate.id),
              candidate_recruitment_detail_id: Number(detail.id)
            }
          })
        }

        let jobTitle = null
        if (detail?.job_title_id) {
          jobTitle = await prisma.jobTitle.findUnique({
            where: { id: BigInt(detail.job_title_id) },
            select: { id: true, name: true }
          })
        }

        const employeeRequest = await prisma.employeeRequest.findUnique({
          where: { id: BigInt(employeeRequestId) },
          select: { id: true, code: true, jobTitleId: true, jobPlacement: true }
        })

        // Fetch onboarding data to get onboardingAcceptedAt
        const onboarding = await prisma.candidate_recruitment_onboarding.findFirst({
          where: { candidate_id: Number(candidate.id) },
          select: { onboardingAcceptedAt: true, onboardingSentAt: true }
        })

        return {
          ...candidate,
          detail,
          assessment,
          jobTitle,
          employeeRequest,
          onboarding
        } as CandidateWithDetail
      })
    )

    return success({ items: candidatesWithRelations, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch candidates by employee request'
    return failure(message)
  }
}

export async function create(data: CreateCandidateData): Promise<RepositoryResult<CandidateRecruitment>> {
  try {
    // Generate a unique token
    const token = randomBytes(32).toString('hex')

    const candidate = await prisma.candidateRecruitment.create({
      data: {
        email: data.email,
        fullname: data.fullname,
        address: data.address || '',
        resident_status: data.residentStatus || '',
        birth_place: data.birthPlace || '',
        birth_date: data.birthDate || null,
        religion: data.religion || '',
        ethnic_group: data.ethnicGroup || '',
        id_no: data.idNo || '',
        tax_id: data.taxId || '',
        bpjs_id: data.bpjsId || '',
        citizenship: data.citizenship || '',
        marrital_status: data.marritalStatus || '',
        gender: (data.gender || 'M') as 'M' | 'F',
        mobile_phone: data.mobilePhone || '',
        driving_license: data.drivingLicense || '',
        document_1: '',
        document_2: '',
        token,
        verify: 'NOT_VERIFIED' as CandidateVerify
      }
    })

    return success(candidate)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create candidate'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateCandidateData): Promise<RepositoryResult<CandidateRecruitment>> {
  try {
    const updateData: Prisma.CandidateRecruitmentUpdateInput = {}

    if (data.fullname !== undefined) updateData.fullname = data.fullname
    if (data.email !== undefined) updateData.email = data.email
    if (data.address !== undefined) updateData.address = data.address
    if (data.residentStatus !== undefined) updateData.resident_status = data.residentStatus
    if (data.birthPlace !== undefined) updateData.birth_place = data.birthPlace
    if (data.birthDate !== undefined) updateData.birth_date = data.birthDate
    if (data.religion !== undefined) updateData.religion = data.religion
    if (data.ethnicGroup !== undefined) updateData.ethnic_group = data.ethnicGroup
    if (data.idNo !== undefined) updateData.id_no = data.idNo
    if (data.taxId !== undefined) updateData.tax_id = data.taxId
    if (data.bpjsId !== undefined) updateData.bpjs_id = data.bpjsId
    if (data.citizenship !== undefined) updateData.citizenship = data.citizenship
    if (data.marritalStatus !== undefined) updateData.marrital_status = data.marritalStatus
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.mobilePhone !== undefined) updateData.mobile_phone = data.mobilePhone
    if (data.domicileAddress !== undefined) updateData.domicile_address = data.domicileAddress
    if (data.drivingLicense !== undefined) updateData.driving_license = data.drivingLicense
    if (data.uniformShirtSize !== undefined) updateData.uniform_shirt_size = data.uniformShirtSize
    if (data.uniformPantsSize !== undefined) updateData.uniform_pants_size = data.uniformPantsSize
    updateData.updatedAt = new Date()

    // Debug: Log what we're sending to Prisma
    console.log('[DEBUG] repository.update - updateData for Prisma:', JSON.stringify(updateData, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2))

    const candidate = await prisma.candidateRecruitment.update({
      where: { id: BigInt(id) },
      data: updateData
    })

    // Debug: Log the result
    console.log('[DEBUG] repository.update - result uniform_shirt_size:', candidate.uniform_shirt_size)
    console.log('[DEBUG] repository.update - result uniform_pants_size:', candidate.uniform_pants_size)
    console.log('[DEBUG] repository.update - result domicile_address:', candidate.domicile_address)

    return success(candidate)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update candidate'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidateRecruitment.delete({
      where: { id: BigInt(id) }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete candidate'
    return failure(message)
  }
}

export async function emailExists(email: string): Promise<RepositoryResult<boolean>> {
  try {
    const candidate = await prisma.candidateRecruitment.findFirst({
      where: { email },
      select: { id: true }
    })
    return success(candidate !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check email existence'
    return failure(message)
  }
}

export async function emailExistsExcept(email: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const candidate = await prisma.candidateRecruitment.findFirst({
      where: {
        email,
        id: { not: BigInt(exceptId) }
      },
      select: { id: true }
    })
    return success(candidate !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check email existence'
    return failure(message)
  }
}

export async function generateToken(id: number): Promise<RepositoryResult<string>> {
  try {
    const token = randomBytes(32).toString('hex')

    await prisma.candidateRecruitment.update({
      where: { id: BigInt(id) },
      data: { token, updatedAt: new Date() }
    })

    return success(token)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate token'
    return failure(message)
  }
}

export async function verifyCandidate(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidateRecruitment.update({
      where: { id: BigInt(id) },
      data: { verify: 'VERIFIED' as CandidateVerify, updatedAt: new Date() }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify candidate'
    return failure(message)
  }
}

export async function countAll(): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.candidateRecruitment.count()
    return success(count)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to count candidates'
    return failure(message)
  }
}

export async function acceptAgreement(
  id: number,
  version?: string
): Promise<RepositoryResult<CandidateRecruitment>> {
  try {
    const candidate = await prisma.candidateRecruitment.update({
      where: { id: BigInt(id) },
      data: {
        agreementAcceptedAt: new Date(),
        agreementVersion: version || '1.0',
        updatedAt: new Date()
      }
    })
    return success(candidate)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept agreement'
    return failure(message)
  }
}
