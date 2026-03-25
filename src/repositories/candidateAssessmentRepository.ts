import { Prisma } from '@prisma/client'
import type { candidate_recruitment_assessment, candidate_assessment_scoring, candidate_assessment_assignee } from '@prisma/client'

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
  mcuDocumentUrl?: string | null
  mcuDocumentName?: string | null
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

    // MCU document fields — cast needed until migration is applied and prisma generate is re-run
    const extendedUpdate = updateData as Record<string, unknown>
    if (data.mcuDocumentUrl !== undefined) extendedUpdate.mcu_document_url = data.mcuDocumentUrl
    if (data.mcuDocumentName !== undefined) extendedUpdate.mcu_document_name = data.mcuDocumentName

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
    updateData.updatedAt = new Date()

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
  description: string,
  documentUrl?: string | null,
  documentName?: string | null
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  return update(id, {
    mcuStatus: status,
    mcuDesc: description,
    ...(documentUrl !== undefined && { mcuDocumentUrl: documentUrl }),
    ...(documentName !== undefined && { mcuDocumentName: documentName }),
  })
}

// Update MCU document only (without changing status)
export async function updateMcuDocument(
  id: number,
  documentUrl: string,
  documentName: string
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  return update(id, {
    mcuDocumentUrl: documentUrl,
    mcuDocumentName: documentName,
  })
}

// Get MCU document info
export async function getMcuDocument(
  candidateId: number
): Promise<RepositoryResult<{ url: string | null; name: string | null } | null>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!assessment) {
      return success(null)
    }

    const record = assessment as unknown as Record<string, unknown>

    return success({
      url: (record.mcu_document_url as string) ?? null,
      name: (record.mcu_document_name as string) ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get MCU document'
    return failure(message)
  }
}

// Schedule MCU - sets mcu_date and mcu_location
export async function scheduleMcu(
  candidateId: number,
  mcuDate: Date,
  mcuLocation: string
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })

    if (!assessment) {
      return failure('Assessment not found for this candidate')
    }

    const updateData: Record<string, unknown> = {
      mcu_date: mcuDate,
      mcu_location: mcuLocation,
      updated_at: new Date()
    }

    const updated = await prisma.candidate_recruitment_assessment.update({
      where: { id: assessment.id },
      data: updateData as Parameters<typeof prisma.candidate_recruitment_assessment.update>[0]['data']
    })

    return success(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to schedule MCU'
    return failure(message)
  }
}

// Start interview - sets interview_started_at, interview_date, and interview_type
export async function startInterview(
  candidateId: number,
  interviewDate?: Date,
  interviewType?: 'online' | 'onsite'
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
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
      data: {
        interview_started_at: new Date(),
        ...(interviewDate && { interview_date: interviewDate }),
        ...(interviewType && { interview_type: interviewType === 'online' ? 'ONLINE' : 'ONSITE' }),
        updatedAt: new Date()
      }
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
  interview1: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean; description: string }
  interview2: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean; description: string }
  mcu: { status: string; passed: boolean; failed: boolean; pending: boolean; locked: boolean }
  allPassed: boolean
  anyFailed: boolean
  currentStage: 'interview1' | 'interview2' | 'mcu' | 'completed' | 'failed'
  interviewStarted: boolean
  interviewStartedAt: string | null
  interviewDate: string | null
  interviewType: string | null
  mcuDate: string | null
  mcuLocation: string | null
}

// ==================== Scoring CRUD ====================

export type CreateScoringData = {
  assessmentId: bigint
  stage: 'INTERVIEW1' | 'INTERVIEW2'
  relevanceOfExperience: number
  trainingUndertaken: number
  technicalSkills: number
  nonTechnicalSkills: number
  communicationSkills: number
  emotionalMaturity: number
  understandingOfPosition: number
  teamworkAbility: number
  totalScore: number
  conclusion: 'PROCEED' | 'RECOMMENDED' | 'REJECTED'
  keyCompetencies?: string | null
  interviewerNotes?: string | null
  assessedBy?: string | null
}

export async function createScoring(data: CreateScoringData): Promise<RepositoryResult<candidate_assessment_scoring>> {
  try {
    const scoring = await prisma.candidate_assessment_scoring.create({
      data: {
        assessment_id: data.assessmentId,
        stage: data.stage,
        relevance_of_experience: data.relevanceOfExperience,
        training_undertaken: data.trainingUndertaken,
        technical_skills: data.technicalSkills,
        non_technical_skills: data.nonTechnicalSkills,
        communication_skills: data.communicationSkills,
        emotional_maturity: data.emotionalMaturity,
        understanding_of_position: data.understandingOfPosition,
        teamwork_ability: data.teamworkAbility,
        total_score: data.totalScore,
        conclusion: data.conclusion,
        key_competencies: data.keyCompetencies ?? Prisma.DbNull,
        interviewer_notes: data.interviewerNotes ?? Prisma.DbNull,
        assessed_by: data.assessedBy ?? null,
        assessed_at: new Date(),
      }
    })
    return success(scoring)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create scoring'
    return failure(message)
  }
}

export async function findScoringByAssessmentAndStage(
  assessmentId: bigint,
  stage: 'INTERVIEW1' | 'INTERVIEW2'
): Promise<RepositoryResult<candidate_assessment_scoring | null>> {
  try {
    const scoring = await prisma.candidate_assessment_scoring.findUnique({
      where: {
        assessment_id_stage: {
          assessment_id: assessmentId,
          stage,
        }
      }
    })
    return success(scoring)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find scoring'
    return failure(message)
  }
}

export async function findScoringByAssessmentId(
  assessmentId: bigint
): Promise<RepositoryResult<candidate_assessment_scoring[]>> {
  try {
    const scorings = await prisma.candidate_assessment_scoring.findMany({
      where: { assessment_id: assessmentId },
      orderBy: { stage: 'asc' }
    })
    return success(scorings)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find scorings'
    return failure(message)
  }
}

export async function upsertScoring(data: CreateScoringData): Promise<RepositoryResult<candidate_assessment_scoring>> {
  try {
    const scoring = await prisma.candidate_assessment_scoring.upsert({
      where: {
        assessment_id_stage: {
          assessment_id: data.assessmentId,
          stage: data.stage,
        }
      },
      create: {
        assessment_id: data.assessmentId,
        stage: data.stage,
        relevance_of_experience: data.relevanceOfExperience,
        training_undertaken: data.trainingUndertaken,
        technical_skills: data.technicalSkills,
        non_technical_skills: data.nonTechnicalSkills,
        communication_skills: data.communicationSkills,
        emotional_maturity: data.emotionalMaturity,
        understanding_of_position: data.understandingOfPosition,
        teamwork_ability: data.teamworkAbility,
        total_score: data.totalScore,
        conclusion: data.conclusion,
        key_competencies: data.keyCompetencies ?? Prisma.DbNull,
        interviewer_notes: data.interviewerNotes ?? Prisma.DbNull,
        assessed_by: data.assessedBy ?? null,
        assessed_at: new Date(),
      },
      update: {
        relevance_of_experience: data.relevanceOfExperience,
        training_undertaken: data.trainingUndertaken,
        technical_skills: data.technicalSkills,
        non_technical_skills: data.nonTechnicalSkills,
        communication_skills: data.communicationSkills,
        emotional_maturity: data.emotionalMaturity,
        understanding_of_position: data.understandingOfPosition,
        teamwork_ability: data.teamworkAbility,
        total_score: data.totalScore,
        conclusion: data.conclusion,
        key_competencies: data.keyCompetencies ?? Prisma.DbNull,
        interviewer_notes: data.interviewerNotes ?? Prisma.DbNull,
        assessed_by: data.assessedBy ?? null,
        assessed_at: new Date(),
        updatedAt: new Date(),
      }
    })
    return success(scoring)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upsert scoring'
    return failure(message)
  }
}

// ==================== Assessment Progress ====================

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
      locked: !interviewStarted,
      description: assessment.interview1_desc || ''
    }

    const interview2 = {
      status: assessment.interview2_status,
      passed: assessment.interview2_status === 'PASSED',
      failed: assessment.interview2_status === 'FAILED',
      pending: assessment.interview2_status === 'PENDING',
      locked: !interview1.passed,
      description: assessment.interview2_desc || ''
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

    // Cast to access interview_date and interview_type fields
    const record = assessment as unknown as Record<string, unknown>

    return success({
      interview1,
      interview2,
      mcu,
      allPassed,
      anyFailed,
      currentStage,
      interviewStarted,
      interviewStartedAt: assessment.interview_started_at?.toISOString() || null,
      interviewDate: record.interview_date ? (record.interview_date as Date).toISOString() : null,
      interviewType: (record.interview_type as string) ?? null,
      mcuDate: record.mcu_date ? (record.mcu_date as Date).toISOString() : null,
      mcuLocation: (record.mcu_location as string) ?? null
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get assessment progress'
    return failure(message)
  }
}

// ==================== Assignee Management ====================

/**
 * Set assessor assignees for an assessment (replaces existing)
 */
export async function setAssignees(
  assessmentId: bigint,
  employeeIds: number[]
): Promise<RepositoryResult<candidate_assessment_assignee[]>> {
  try {
    // Delete existing assignees
    await prisma.candidate_assessment_assignee.deleteMany({
      where: { assessment_id: assessmentId }
    })

    // Create new assignees
    if (employeeIds.length > 0) {
      await prisma.candidate_assessment_assignee.createMany({
        data: employeeIds.map(employeeId => ({
          assessment_id: assessmentId,
          employee_id: employeeId,
        }))
      })
    }

    // Fetch and return the created assignees
    const assignees = await prisma.candidate_assessment_assignee.findMany({
      where: { assessment_id: assessmentId }
    })

    return success(assignees)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set assignees'
    return failure(message)
  }
}

/**
 * Get all assignees for an assessment
 */
export async function getAssignees(
  assessmentId: bigint
): Promise<RepositoryResult<candidate_assessment_assignee[]>> {
  try {
    const assignees = await prisma.candidate_assessment_assignee.findMany({
      where: { assessment_id: assessmentId }
    })
    return success(assignees)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get assignees'
    return failure(message)
  }
}

/**
 * Get assignees by candidate ID
 */
export async function getAssigneesByCandidateId(
  candidateId: number
): Promise<RepositoryResult<number[]>> {
  try {
    const assessment = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId },
      include: { assignees: true }
    })

    if (!assessment) {
      return success([])
    }

    const employeeIds = assessment.assignees.map(a => a.employee_id)
    return success(employeeIds)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get assignees'
    return failure(message)
  }
}

/**
 * Add a single assignee to an assessment
 */
export async function addAssignee(
  assessmentId: bigint,
  employeeId: number
): Promise<RepositoryResult<candidate_assessment_assignee>> {
  try {
    const assignee = await prisma.candidate_assessment_assignee.create({
      data: {
        assessment_id: assessmentId,
        employee_id: employeeId,
      }
    })
    return success(assignee)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add assignee'
    return failure(message)
  }
}

/**
 * Remove a single assignee from an assessment
 */
export async function removeAssignee(
  assessmentId: bigint,
  employeeId: number
): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.candidate_assessment_assignee.delete({
      where: {
        assessment_id_employee_id: {
          assessment_id: assessmentId,
          employee_id: employeeId,
        }
      }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove assignee'
    return failure(message)
  }
}
