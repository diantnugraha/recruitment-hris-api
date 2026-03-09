import type { candidate_recruitment_assessment, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

// Assessment status enum values matching database
export const ASSESSMENT_STATUS = {
  PENDING: 'PENDING',
  PASSED: 'PASSED',
  FAILED: 'FAILED'
} as const

export type AssessmentStatus = typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS]

export type CreateAssessmentData = {
  candidateId: number
  candidateRecruitmentDetailId: number
}

export type UpdateAssessmentData = {
  // Interview 1
  interview1Status?: AssessmentStatus
  interview1Desc?: string
  // Interview 2
  interview2Status?: AssessmentStatus
  interview2Desc?: string
  // MCU
  mcuStatus?: AssessmentStatus
  mcuDesc?: string
  // Additional fields
  reasonToMove?: string
  purposeOfApplying?: string
  lastSalary?: string
  expectedSalary?: string
  whenReadyWork?: string
  activeLanguage?: string
  loyality?: string
  refContactName?: string
  refMobilePhone?: string
  lastJobDescription?: string
  tasksJobs?: string
  rotateWork?: string
  employeesYouKnow?: string
  relationshipWithEmployee?: string
  assessmentAssignedTo?: string
}

export async function findById(id: number): Promise<RepositoryResult<candidate_recruitment_assessment | null>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findUnique({
      where: { id: BigInt(id) }
    })
    return success(assessment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find assessment'
    return failure(message)
  }
}

export async function findByCandidateId(candidateId: number): Promise<RepositoryResult<candidate_recruitment_assessment | null>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })
    return success(assessment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find assessment by candidate'
    return failure(message)
  }
}

export async function findByDetailId(detailId: number): Promise<RepositoryResult<candidate_recruitment_assessment | null>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_recruitment_detail_id: detailId }
    })
    return success(assessment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find assessment by detail'
    return failure(message)
  }
}

export async function create(data: CreateAssessmentData): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.create({
      data: {
        candidate_id: data.candidateId,
        candidate_recruitment_detail_id: data.candidateRecruitmentDetailId,
        interview1_status: 'PENDING',
        interview1_desc: '',
        interview2_status: 'PENDING',
        interview2_desc: '',
        mcu_status: 'PENDING',
        mcu_desc: '',
        reason_to_move: '',
        purpose_of_applying: '',
        last_salary: '',
        expected_salary: '',
        when_ready_work: '',
        active_language: '',
        loyality: '',
        ref_contact_name: '',
        ref_mobile_phone: '',
        last_job_description: '',
        tasks_jobs: '',
        rotate_work: '',
        employees_you_know: '',
        relationship_with_the_employee: '',
        assessment_assigned_to: ''
      }
    })

    return success(assessment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create assessment'
    return failure(message)
  }
}

export async function update(
  id: number,
  data: UpdateAssessmentData
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  try {
    const updateData: Prisma.candidate_recruitment_assessmentUpdateInput = {}

    // Interview 1
    if (data.interview1Status !== undefined) updateData.interview1_status = data.interview1Status
    if (data.interview1Desc !== undefined) updateData.interview1_desc = data.interview1Desc

    // Interview 2
    if (data.interview2Status !== undefined) updateData.interview2_status = data.interview2Status
    if (data.interview2Desc !== undefined) updateData.interview2_desc = data.interview2Desc

    // MCU
    if (data.mcuStatus !== undefined) updateData.mcu_status = data.mcuStatus
    if (data.mcuDesc !== undefined) updateData.mcu_desc = data.mcuDesc

    // Additional fields
    if (data.reasonToMove !== undefined) updateData.reason_to_move = data.reasonToMove
    if (data.purposeOfApplying !== undefined) updateData.purpose_of_applying = data.purposeOfApplying
    if (data.lastSalary !== undefined) updateData.last_salary = data.lastSalary
    if (data.expectedSalary !== undefined) updateData.expected_salary = data.expectedSalary
    if (data.whenReadyWork !== undefined) updateData.when_ready_work = data.whenReadyWork
    if (data.activeLanguage !== undefined) updateData.active_language = data.activeLanguage
    if (data.loyality !== undefined) updateData.loyality = data.loyality
    if (data.refContactName !== undefined) updateData.ref_contact_name = data.refContactName
    if (data.refMobilePhone !== undefined) updateData.ref_mobile_phone = data.refMobilePhone
    if (data.lastJobDescription !== undefined) updateData.last_job_description = data.lastJobDescription
    if (data.tasksJobs !== undefined) updateData.tasks_jobs = data.tasksJobs
    if (data.rotateWork !== undefined) updateData.rotate_work = data.rotateWork
    if (data.employeesYouKnow !== undefined) updateData.employees_you_know = data.employeesYouKnow
    if (data.relationshipWithEmployee !== undefined) updateData.relationship_with_the_employee = data.relationshipWithEmployee
    if (data.assessmentAssignedTo !== undefined) updateData.assessment_assigned_to = data.assessmentAssignedTo

    const assessment = await prisma.candidate_recruitment_assessment.update({
      where: { id: BigInt(id) },
      data: updateData
    })

    return success(assessment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update assessment'
    return failure(message)
  }
}

// Helper function to update just interview 1
export async function updateInterview1(
  id: number,
  status: AssessmentStatus,
  description: string
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  return update(id, {
    interview1Status: status,
    interview1Desc: description
  })
}

// Helper function to update just interview 2
export async function updateInterview2(
  id: number,
  status: AssessmentStatus,
  description: string
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  return update(id, {
    interview2Status: status,
    interview2Desc: description
  })
}

// Helper function to update just MCU
export async function updateMcu(
  id: number,
  status: AssessmentStatus,
  description: string
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  return update(id, {
    mcuStatus: status,
    mcuDesc: description
  })
}

// Start interview - sets interview_started_at to current timestamp
export async function startInterview(candidateId: number): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!assessment) {
      return failure('Assessment not found for this candidate')
    }

    // Check if already started
    if (assessment.interview_started_at !== null) {
      return success(assessment) // Already started, return current state
    }

    const updated = await prisma.candidate_recruitment_assessment.update({
      where: { id: assessment.id },
      data: { interview_started_at: new Date() }
    })

    return success(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start interview'
    return failure(message)
  }
}

export async function remove(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidate_recruitment_assessment.delete({
      where: { id: BigInt(id) }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete assessment'
    return failure(message)
  }
}

export async function removeByCandidateId(candidateId: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidate_recruitment_assessment.deleteMany({
      where: { candidate_id: candidateId }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete assessments'
    return failure(message)
  }
}

// Check if candidate passed all assessments (eligible for onboarding)
export async function hasPassedAllAssessments(candidateId: number): Promise<RepositoryResult<boolean>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!assessment) {
      return success(false)
    }

    const allPassed =
      assessment.interview1_status === 'PASSED' &&
      assessment.interview2_status === 'PASSED' &&
      assessment.mcu_status === 'PASSED'

    return success(allPassed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check assessment status'
    return failure(message)
  }
}

// Check if candidate failed any assessment
export async function hasFailedAnyAssessment(candidateId: number): Promise<RepositoryResult<boolean>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!assessment) {
      return success(false)
    }

    const anyFailed =
      assessment.interview1_status === 'FAILED' ||
      assessment.interview2_status === 'FAILED' ||
      assessment.mcu_status === 'FAILED'

    return success(anyFailed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check assessment status'
    return failure(message)
  }
}

// Get assessment progress (how many stages completed)
export type AssessmentProgress = {
  interview1: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean }
  interview2: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean }
  mcu: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean }
  allPassed: boolean
  anyFailed: boolean
  currentStage: 'interview1' | 'interview2' | 'mcu' | 'completed' | 'failed'
  interviewStarted: boolean
  interviewStartedAt: string | null
}

export async function getProgress(candidateId: number): Promise<RepositoryResult<AssessmentProgress | null>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!assessment) {
      return success(null)
    }

    // Check if interview has been started (interview_started_at is set)
    const interviewStarted = assessment.interview_started_at !== null

    const interview1 = {
      status: assessment.interview1_status,
      passed: assessment.interview1_status === 'PASSED',
      failed: assessment.interview1_status === 'FAILED',
      pending: assessment.interview1_status === 'PENDING',
      locked: !interviewStarted // Interview 1 is locked until interview is started
    }

    const interview2 = {
      status: assessment.interview2_status,
      passed: assessment.interview2_status === 'PASSED',
      failed: assessment.interview2_status === 'FAILED',
      pending: assessment.interview2_status === 'PENDING',
      locked: !interview1.passed // Interview 2 is locked until Interview 1 passes
    }

    const mcu = {
      status: assessment.mcu_status,
      passed: assessment.mcu_status === 'PASSED',
      failed: assessment.mcu_status === 'FAILED',
      pending: assessment.mcu_status === 'PENDING',
      locked: !interview2.passed // MCU is locked until Interview 2 passes
    }

    const allPassed = interview1.passed && interview2.passed && mcu.passed
    const anyFailed = interview1.failed || interview2.failed || mcu.failed

    let currentStage: AssessmentProgress['currentStage'] = 'interview1'
    if (anyFailed) {
      currentStage = 'failed'
    } else if (allPassed) {
      currentStage = 'completed'
    } else if (interview1.passed && interview2.passed) {
      currentStage = 'mcu'
    } else if (interview1.passed) {
      currentStage = 'interview2'
    }

    return success({
      interview1,
      interview2,
      mcu,
      allPassed,
      anyFailed,
      currentStage,
      interviewStarted,
      interviewStartedAt: assessment.interview_started_at?.toISOString() || null
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get assessment progress'
    return failure(message)
  }
}
