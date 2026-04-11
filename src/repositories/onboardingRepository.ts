import { Prisma } from '@prisma/client'
import type { candidate_recruitment_onboarding, facillities, OnboardingProgram, facility_pics, program_pics } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

// Types for PIC relations
export type FacilityPicSelect = Pick<facility_pics, 'id' | 'employee_id'>
export type ProgramPicSelect = Pick<program_pics, 'id' | 'employee_id'>

export type FacilityWithPics = facillities & {
  pics: FacilityPicSelect[]
}

export type ProgramWithPics = OnboardingProgram & {
  pics: ProgramPicSelect[]
}

// Types for onboarding with relations
export type OnboardingWithRelations = candidate_recruitment_onboarding & {
  facilities?: FacilityWithPics[]
  programs?: ProgramWithPics[]
}

// ========== Onboarding Main Record ==========

export type CreateOnboardingData = {
  candidateId: number
  employeeRequestId: number
  candidateRecruitmentDetailId: number
  jobPlacement?: string | undefined
  document?: string | undefined
  documentCandidate?: string | undefined
}

export type UpdateOnboardingData = {
  jobPlacement?: string | undefined
  document?: string | undefined
  documentCandidate?: string | undefined
  joinDate?: string | undefined
  onboardingSentAt?: Date | undefined
}

export async function findOnboardingById(id: number): Promise<RepositoryResult<OnboardingWithRelations | null>> {
  try {
    const onboarding = await prisma.candidate_recruitment_onboarding.findUnique({
      where: { id: BigInt(id) }
    })

    if (!onboarding) {
      return success(null)
    }

    // Fetch facilities with pics
    const facilities = await prisma.facillities.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })

    // Fetch programs with pics
    const programs = await prisma.onboardingProgram.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })

    return success({
      ...onboarding,
      facilities,
      programs
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find onboarding'
    return failure(message)
  }
}

export async function findOnboardingByCandidateId(candidateId: number): Promise<RepositoryResult<OnboardingWithRelations | null>> {
  try {
    const onboarding = await prisma.candidate_recruitment_onboarding.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!onboarding) {
      return success(null)
    }

    // Fetch facilities with pics
    const facilities = await prisma.facillities.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })

    // Fetch programs with pics
    const programs = await prisma.onboardingProgram.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })

    return success({
      ...onboarding,
      facilities,
      programs
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find onboarding by candidate'
    return failure(message)
  }
}

export async function createOnboarding(data: CreateOnboardingData): Promise<RepositoryResult<candidate_recruitment_onboarding>> {
  try {
    const onboarding = await prisma.candidate_recruitment_onboarding.create({
      data: {
        candidate_id: data.candidateId,
        employee_request_id: data.employeeRequestId,
        candidate_recruitment_detail_id: data.candidateRecruitmentDetailId,
        job_placement: data.jobPlacement || '',
        document: data.document || '',
        document_candidate: data.documentCandidate || ''
      }
    })

    return success(onboarding)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create onboarding'
    return failure(message)
  }
}

export async function updateOnboarding(
  id: number,
  data: UpdateOnboardingData
): Promise<RepositoryResult<candidate_recruitment_onboarding>> {
  try {
    const updateData: Prisma.candidate_recruitment_onboardingUpdateInput = {}

    if (data.jobPlacement !== undefined) updateData.job_placement = data.jobPlacement
    if (data.document !== undefined) updateData.document = data.document
    if (data.documentCandidate !== undefined) updateData.document_candidate = data.documentCandidate
    if (data.joinDate !== undefined) updateData.join_date = data.joinDate
    if (data.onboardingSentAt !== undefined) updateData.onboardingSentAt = data.onboardingSentAt
    updateData.updatedAt = new Date()

    const onboarding = await prisma.candidate_recruitment_onboarding.update({
      where: { id: BigInt(id) },
      data: updateData
    })

    return success(onboarding)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update onboarding'
    return failure(message)
  }
}

export async function removeOnboarding(id: number): Promise<RepositoryResult<boolean>> {
  try {
    // First delete all facilities and programs
    await prisma.facillities.deleteMany({
      where: { candidate_recruitment_onboarding_id: id }
    })
    await prisma.onboardingProgram.deleteMany({
      where: { candidate_recruitment_onboarding_id: id }
    })

    // Then delete the onboarding record
    await prisma.candidate_recruitment_onboarding.delete({
      where: { id: BigInt(id) }
    })

    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete onboarding'
    return failure(message)
  }
}

// ========== Facilities ==========

export type CreateFacilityData = {
  onboardingId: number
  item: string
  qty: number
  unit: string
  condition: string
  status: string
  pic_employee_ids: number[]
}

export type UpdateFacilityData = {
  item?: string
  qty?: number
  unit?: string
  condition?: string
  status?: string
  pic_employee_ids?: number[]
}

export async function generateInventoryNo(): Promise<string> {
  const prefix = 'INV-TNI-'
  const lastFacility = await prisma.facillities.findFirst({
    where: { inventory_no: { startsWith: prefix } },
    orderBy: { inventory_no: 'desc' },
    select: { inventory_no: true },
  })

  let nextNumber = 1
  if (lastFacility?.inventory_no) {
    const currentNum = parseInt(lastFacility.inventory_no.replace(prefix, ''), 10)
    if (!isNaN(currentNum)) nextNumber = currentNum + 1
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

export async function findFacilitiesByOnboardingId(onboardingId: number): Promise<RepositoryResult<FacilityWithPics[]>> {
  try {
    const facilities = await prisma.facillities.findMany({
      where: { candidate_recruitment_onboarding_id: onboardingId },
      orderBy: { created_at: 'desc' },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })
    return success(facilities)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch facilities'
    return failure(message)
  }
}

export async function findFacilityById(id: number): Promise<RepositoryResult<FacilityWithPics | null>> {
  try {
    const facility = await prisma.facillities.findUnique({
      where: { id: BigInt(id) },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })
    return success(facility)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find facility'
    return failure(message)
  }
}

export async function createFacility(data: CreateFacilityData): Promise<RepositoryResult<FacilityWithPics>> {
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const inventoryNo = await generateInventoryNo()

      const facility = await prisma.$transaction(async (tx) => {
        const created = await tx.facillities.create({
          data: {
            candidate_recruitment_onboarding_id: data.onboardingId,
            inventory_no: inventoryNo,
            item: data.item,
            qty: data.qty,
            unit: data.unit,
            condition: data.condition,
            status: data.status
          }
        })

        if (data.pic_employee_ids.length > 0) {
          await tx.facility_pics.createMany({
            data: data.pic_employee_ids.map((employeeId) => ({
              facility_id: created.id,
              employee_id: employeeId
            }))
          })
        }

        return tx.facillities.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            pics: {
              select: { id: true, employee_id: true }
            }
          }
        })
      })

      return success(facility)
    } catch (err: unknown) {
      // Retry on unique constraint violation (inventory_no collision)
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        attempt < MAX_RETRIES - 1
      ) {
        continue
      }
      const message = err instanceof Error ? err.message : 'Failed to create facility'
      return failure(message)
    }
  }

  return failure('Failed to create facility after maximum retries')
}

export async function updateFacility(
  id: number,
  data: UpdateFacilityData
): Promise<RepositoryResult<FacilityWithPics>> {
  try {
    const facility = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.facillitiesUpdateInput = {}

      if (data.item !== undefined) updateData.item = data.item
      if (data.qty !== undefined) updateData.qty = data.qty
      if (data.unit !== undefined) updateData.unit = data.unit
      if (data.condition !== undefined) updateData.condition = data.condition
      if (data.status !== undefined) updateData.status = data.status

      await tx.facillities.update({
        where: { id: BigInt(id) },
        data: updateData
      })

      // Replace pics if provided
      if (data.pic_employee_ids !== undefined) {
        await tx.facility_pics.deleteMany({
          where: { facility_id: BigInt(id) }
        })

        if (data.pic_employee_ids.length > 0) {
          await tx.facility_pics.createMany({
            data: data.pic_employee_ids.map((employeeId) => ({
              facility_id: BigInt(id),
              employee_id: employeeId
            }))
          })
        }
      }

      return tx.facillities.findUniqueOrThrow({
        where: { id: BigInt(id) },
        include: {
          pics: {
            select: { id: true, employee_id: true }
          }
        }
      })
    })

    return success(facility)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update facility'
    return failure(message)
  }
}

export async function removeFacility(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.facillities.delete({
      where: { id: BigInt(id) }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete facility'
    return failure(message)
  }
}

// ========== Onboarding Programs ==========

export type CreateProgramData = {
  onboardingId: number
  program: string
  date: string
  location: string
  status?: string
  pic_employee_ids: number[]
}

export type UpdateProgramData = {
  program?: string
  date?: string
  location?: string
  status?: string
  pic_employee_ids?: number[]
}

export async function findProgramsByOnboardingId(onboardingId: number): Promise<RepositoryResult<ProgramWithPics[]>> {
  try {
    const programs = await prisma.onboardingProgram.findMany({
      where: { candidate_recruitment_onboarding_id: onboardingId },
      orderBy: { createdAt: 'desc' },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })
    return success(programs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch programs'
    return failure(message)
  }
}

export async function findProgramById(id: number): Promise<RepositoryResult<ProgramWithPics | null>> {
  try {
    const program = await prisma.onboardingProgram.findUnique({
      where: { id: BigInt(id) },
      include: {
        pics: {
          select: { id: true, employee_id: true }
        }
      }
    })
    return success(program)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find program'
    return failure(message)
  }
}

export async function createProgram(data: CreateProgramData): Promise<RepositoryResult<ProgramWithPics>> {
  try {
    const program = await prisma.$transaction(async (tx) => {
      const created = await tx.onboardingProgram.create({
        data: {
          candidate_recruitment_onboarding_id: data.onboardingId,
          program: data.program,
          date: data.date,
          location: data.location,
          pic_legacy: '',
          status: data.status || 'Scheduled'
        }
      })

      if (data.pic_employee_ids.length > 0) {
        await tx.program_pics.createMany({
          data: data.pic_employee_ids.map((employeeId) => ({
            program_id: created.id,
            employee_id: employeeId
          }))
        })
      }

      return tx.onboardingProgram.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          pics: {
            select: { id: true, employee_id: true }
          }
        }
      })
    })

    return success(program)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create program'
    return failure(message)
  }
}

export async function updateProgram(
  id: number,
  data: UpdateProgramData
): Promise<RepositoryResult<ProgramWithPics>> {
  try {
    const program = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.OnboardingProgramUpdateInput = {}

      if (data.program !== undefined) updateData.program = data.program
      if (data.date !== undefined) updateData.date = data.date
      if (data.location !== undefined) updateData.location = data.location
      if (data.status !== undefined) updateData.status = data.status

      await tx.onboardingProgram.update({
        where: { id: BigInt(id) },
        data: updateData
      })

      // Replace pics if provided
      if (data.pic_employee_ids !== undefined) {
        await tx.program_pics.deleteMany({
          where: { program_id: BigInt(id) }
        })

        if (data.pic_employee_ids.length > 0) {
          await tx.program_pics.createMany({
            data: data.pic_employee_ids.map((employeeId) => ({
              program_id: BigInt(id),
              employee_id: employeeId
            }))
          })
        }
      }

      return tx.onboardingProgram.findUniqueOrThrow({
        where: { id: BigInt(id) },
        include: {
          pics: {
            select: { id: true, employee_id: true }
          }
        }
      })
    })

    return success(program)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update program'
    return failure(message)
  }
}

export async function removeProgram(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.onboardingProgram.delete({
      where: { id: BigInt(id) }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete program'
    return failure(message)
  }
}

// ========== Utility Functions ==========

export async function countFacilitiesByOnboardingId(onboardingId: number): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.facillities.count({
      where: { candidate_recruitment_onboarding_id: onboardingId }
    })
    return success(count)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to count facilities'
    return failure(message)
  }
}

export async function countProgramsByOnboardingId(onboardingId: number): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.onboardingProgram.count({
      where: { candidate_recruitment_onboarding_id: onboardingId }
    })
    return success(count)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to count programs'
    return failure(message)
  }
}

// Accept onboarding - set onboarding_accepted_at timestamp
export async function acceptOnboarding(candidateId: number): Promise<RepositoryResult<candidate_recruitment_onboarding>> {
  try {
    const onboarding = await prisma.candidate_recruitment_onboarding.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!onboarding) {
      return failure('Onboarding not found for this candidate')
    }

    const updated = await prisma.candidate_recruitment_onboarding.update({
      where: { id: onboarding.id },
      data: {
        onboardingAcceptedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return success(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept onboarding'
    return failure(message)
  }
}

// Check if onboarding is complete (has job placement, at least 1 facility, at least 1 program)
export async function isOnboardingComplete(candidateId: number): Promise<RepositoryResult<boolean>> {
  try {
    const onboarding = await prisma.candidate_recruitment_onboarding.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!onboarding || !onboarding.job_placement) {
      return success(false)
    }

    const facilityCount = await prisma.facillities.count({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) }
    })

    const programCount = await prisma.onboardingProgram.count({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) }
    })

    return success(facilityCount > 0 && programCount > 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check onboarding status'
    return failure(message)
  }
}
