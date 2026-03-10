import type { candidate_recruitment_onboarding, facillities, OnboardingProgram, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

// Types for onboarding with relations
export type OnboardingWithRelations = candidate_recruitment_onboarding & {
  facilities?: facillities[]
  programs?: OnboardingProgram[]
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
}

export async function findOnboardingById(id: number): Promise<RepositoryResult<OnboardingWithRelations | null>> {
  try {
    const onboarding = await prisma.candidate_recruitment_onboarding.findUnique({
      where: { id: BigInt(id) }
    })

    if (!onboarding) {
      return success(null)
    }

    // Fetch facilities
    const facilities = await prisma.facillities.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) }
    })

    // Fetch programs
    const programs = await prisma.onboardingProgram.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) }
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

    // Fetch facilities
    const facilities = await prisma.facillities.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) }
    })

    // Fetch programs
    const programs = await prisma.onboardingProgram.findMany({
      where: { candidate_recruitment_onboarding_id: Number(onboarding.id) }
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
  inventoryNo: string
  item: string
  qty: number
  unit: string
  condition: string
  status: string
}

export type UpdateFacilityData = {
  inventoryNo?: string
  item?: string
  qty?: number
  unit?: string
  condition?: string
  status?: string
}

export async function findFacilitiesByOnboardingId(onboardingId: number): Promise<RepositoryResult<facillities[]>> {
  try {
    const facilities = await prisma.facillities.findMany({
      where: { candidate_recruitment_onboarding_id: onboardingId },
      orderBy: { created_at: 'desc' }
    })
    return success(facilities)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch facilities'
    return failure(message)
  }
}

export async function findFacilityById(id: number): Promise<RepositoryResult<facillities | null>> {
  try {
    const facility = await prisma.facillities.findUnique({
      where: { id: BigInt(id) }
    })
    return success(facility)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find facility'
    return failure(message)
  }
}

export async function createFacility(data: CreateFacilityData): Promise<RepositoryResult<facillities>> {
  try {
    const facility = await prisma.facillities.create({
      data: {
        candidate_recruitment_onboarding_id: data.onboardingId,
        inventory_no: data.inventoryNo,
        item: data.item,
        qty: data.qty,
        unit: data.unit,
        condition: data.condition,
        status: data.status
      }
    })

    return success(facility)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create facility'
    return failure(message)
  }
}

export async function updateFacility(
  id: number,
  data: UpdateFacilityData
): Promise<RepositoryResult<facillities>> {
  try {
    const updateData: Prisma.facillitiesUpdateInput = {}

    if (data.inventoryNo !== undefined) updateData.inventory_no = data.inventoryNo
    if (data.item !== undefined) updateData.item = data.item
    if (data.qty !== undefined) updateData.qty = data.qty
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.condition !== undefined) updateData.condition = data.condition
    if (data.status !== undefined) updateData.status = data.status

    const facility = await prisma.facillities.update({
      where: { id: BigInt(id) },
      data: updateData
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
  pic: string
  status: string
}

export type UpdateProgramData = {
  program?: string
  date?: string
  location?: string
  pic?: string
  status?: string
}

export async function findProgramsByOnboardingId(onboardingId: number): Promise<RepositoryResult<OnboardingProgram[]>> {
  try {
    const programs = await prisma.onboardingProgram.findMany({
      where: { candidate_recruitment_onboarding_id: onboardingId },
      orderBy: { createdAt: 'desc' }
    })
    return success(programs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch programs'
    return failure(message)
  }
}

export async function findProgramById(id: number): Promise<RepositoryResult<OnboardingProgram | null>> {
  try {
    const program = await prisma.onboardingProgram.findUnique({
      where: { id: BigInt(id) }
    })
    return success(program)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find program'
    return failure(message)
  }
}

export async function createProgram(data: CreateProgramData): Promise<RepositoryResult<OnboardingProgram>> {
  try {
    const program = await prisma.onboardingProgram.create({
      data: {
        candidate_recruitment_onboarding_id: data.onboardingId,
        program: data.program,
        date: data.date,
        location: data.location,
        pic: data.pic,
        status: data.status
      }
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
): Promise<RepositoryResult<OnboardingProgram>> {
  try {
    const updateData: Prisma.OnboardingProgramUpdateInput = {}

    if (data.program !== undefined) updateData.program = data.program
    if (data.date !== undefined) updateData.date = data.date
    if (data.location !== undefined) updateData.location = data.location
    if (data.pic !== undefined) updateData.pic = data.pic
    if (data.status !== undefined) updateData.status = data.status

    const program = await prisma.onboardingProgram.update({
      where: { id: BigInt(id) },
      data: updateData
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
