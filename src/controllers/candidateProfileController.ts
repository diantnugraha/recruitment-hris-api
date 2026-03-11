import type { FastifyRequest, FastifyReply } from 'fastify'
import type {
  candidate_recruitment_educational_background,
  candidate_recruitment_work_experiences,
  candidate_recruitment_family_members,
  candidate_recruitment_course_experience,
  candidate_recruitment_assessment
} from '@prisma/client'

import * as candidateProfileService from '../services/candidateProfileService.js'
import { successResponse } from '../utils/response.js'
import { UnauthorizedError } from '../errors/index.js'
import type {
  EducationalBackgroundInput,
  WorkExperienceInput,
  FamilyMemberInput,
  CourseTrainingInput,
  AssessmentInput
} from '../schemas/candidateProfileSchemas.js'

// ==================== TRANSFORMERS ====================

function transformEducation(item: candidate_recruitment_educational_background) {
  return {
    id: Number(item.id),
    candidate_id: item.candidate_id,
    school_university: item.school_university,
    city: item.city,
    degree: item.degree,
    major: item.major,
    year_graduate: item.year_graduate,
    created_at: item.createdAt?.toISOString() || null,
    updated_at: item.updatedAt?.toISOString() || null
  }
}

function transformWorkExperience(item: candidate_recruitment_work_experiences) {
  return {
    id: Number(item.id),
    candidate_id: item.candidate_id,
    company: item.company,
    city: item.city,
    job_title: item.job_title,
    period: item.period,
    length_of_working: item.length_of_working,
    created_at: item.createdAt?.toISOString() || null,
    updated_at: item.updatedAt?.toISOString() || null
  }
}

function transformFamily(item: candidate_recruitment_family_members) {
  return {
    id: Number(item.id),
    candidate_id: item.candidate_id,
    name: item.name,
    relation: item.relation,
    age: item.age,
    education: item.education,
    work: item.work,
    created_at: item.createdAt?.toISOString() || null,
    updated_at: item.updatedAt?.toISOString() || null
  }
}

function transformTraining(item: candidate_recruitment_course_experience) {
  return {
    id: Number(item.id),
    candidate_id: item.candidate_id,
    course_topic: item.course_topic,
    provider: item.provider,
    year: item.year,
    city: item.city,
    certificate: item.certificate,
    created_at: item.createdAt?.toISOString() || null,
    updated_at: item.updatedAt?.toISOString() || null
  }
}

function transformAssessment(item: candidate_recruitment_assessment) {
  return {
    id: Number(item.id),
    candidate_id: item.candidate_id,
    reason_leaving_last_job: item.reason_to_move,
    last_job_description: item.last_job_description,
    reason_applying: item.purpose_of_applying,
    relevant_skills: item.tasks_jobs,
    last_salary: item.last_salary,
    expected_salary: item.expected_salary,
    active_language: item.active_language,
    willing_to_transfer: item.rotate_work,
    willing_to_double_work: item.loyality,
    known_employees: item.employees_you_know,
    ready_to_work: item.when_ready_work,
    employee_relationship: item.relationship_with_the_employee,
    reference_contact_name: item.ref_contact_name,
    reference_contact_phone: item.ref_mobile_phone,
    created_at: item.createdAt?.toISOString() || null,
    updated_at: item.updatedAt?.toISOString() || null
  }
}

// ==================== EDUCATIONAL BACKGROUND ====================

export async function getEducation(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.getEducation(request.candidate.candidateId)

  return reply.status(200).send(
    successResponse(items.map(transformEducation))
  )
}

export async function saveEducation(
  request: FastifyRequest<{ Body: EducationalBackgroundInput }>,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.saveEducation(
    request.candidate.candidateId,
    request.body.items
  )

  return reply.status(200).send(
    successResponse(items.map(transformEducation))
  )
}

// ==================== WORK EXPERIENCE ====================

export async function getWorkExperience(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.getWorkExperience(request.candidate.candidateId)

  return reply.status(200).send(
    successResponse(items.map(transformWorkExperience))
  )
}

export async function saveWorkExperience(
  request: FastifyRequest<{ Body: WorkExperienceInput }>,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.saveWorkExperience(
    request.candidate.candidateId,
    request.body.items
  )

  return reply.status(200).send(
    successResponse(items.map(transformWorkExperience))
  )
}

// ==================== FAMILY MEMBERS ====================

export async function getFamily(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.getFamily(request.candidate.candidateId)

  return reply.status(200).send(
    successResponse(items.map(transformFamily))
  )
}

export async function saveFamily(
  request: FastifyRequest<{ Body: FamilyMemberInput }>,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.saveFamily(
    request.candidate.candidateId,
    request.body.items
  )

  return reply.status(200).send(
    successResponse(items.map(transformFamily))
  )
}

// ==================== COURSE/TRAINING ====================

export async function getTraining(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.getTraining(request.candidate.candidateId)

  return reply.status(200).send(
    successResponse(items.map(transformTraining))
  )
}

export async function saveTraining(
  request: FastifyRequest<{ Body: CourseTrainingInput }>,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const items = await candidateProfileService.saveTraining(
    request.candidate.candidateId,
    request.body.items
  )

  return reply.status(200).send(
    successResponse(items.map(transformTraining))
  )
}

// ==================== ASSESSMENT ====================

export async function getAssessment(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const item = await candidateProfileService.getAssessment(request.candidate.candidateId)

  if (!item) {
    // Return empty assessment structure if not found
    return reply.status(200).send(
      successResponse({
        id: 0,
        candidate_id: request.candidate.candidateId,
        reason_leaving_last_job: '',
        last_job_description: '',
        reason_applying: '',
        relevant_skills: '',
        last_salary: '',
        expected_salary: '',
        active_language: '',
        willing_to_transfer: '',
        willing_to_double_work: '',
        known_employees: '',
        ready_to_work: '',
        employee_relationship: '',
        reference_contact_name: '',
        reference_contact_phone: '',
        created_at: null,
        updated_at: null
      })
    )
  }

  return reply.status(200).send(
    successResponse(transformAssessment(item))
  )
}

export async function saveAssessment(
  request: FastifyRequest<{ Body: AssessmentInput }>,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const item = await candidateProfileService.saveAssessment(
    request.candidate.candidateId,
    request.body
  )

  return reply.status(200).send(
    successResponse(transformAssessment(item))
  )
}

// ==================== SUBMIT BIODATA ====================

export async function submitBiodata(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  await candidateProfileService.submitBiodata(request.candidate.candidateId)

  return reply.status(200).send(
    successResponse(null, 'Biodata submitted successfully')
  )
}

// ==================== INTERVIEW PROGRESS ====================

export async function getInterviewProgress(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const progress = await candidateProfileService.getInterviewProgress(request.candidate.candidateId)

  // If no assessment exists, return null (HR hasn't started the process yet)
  if (!progress) {
    return reply.status(200).send(successResponse(null))
  }

  return reply.status(200).send(
    successResponse({
      interview1: progress.interview1,
      interview2: progress.interview2,
      current_stage: progress.currentStage,
      interview_started: progress.interviewStarted,
      interview_started_at: progress.interviewStartedAt,
      interview_date: progress.interviewDate,
      interview_type: progress.interviewType,
      all_passed: progress.allPassed,
      any_failed: progress.anyFailed
    })
  )
}

// ==================== MCU STATUS ====================

export async function getMcuStatus(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const assessment = await candidateProfileService.getMcuStatus(request.candidate.candidateId)

  // If no assessment exists, return null
  if (!assessment) {
    return reply.status(200).send(successResponse(null))
  }

  // Cast to access mcu_document fields
  const record = assessment as unknown as Record<string, unknown>

  return reply.status(200).send(
    successResponse({
      status: assessment.mcu_status,
      description: assessment.mcu_desc,
      document_url: (record.mcu_document_url as string) ?? null,
      document_name: (record.mcu_document_name as string) ?? null
    })
  )
}

// ==================== ONBOARDING ====================

export async function getOnboarding(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.candidate) {
    throw new UnauthorizedError('Not authenticated')
  }

  const onboarding = await candidateProfileService.getOnboarding(request.candidate.candidateId)

  // If no onboarding exists, return null (HR hasn't created it yet)
  if (!onboarding) {
    return reply.status(200).send(successResponse(null))
  }

  return reply.status(200).send(
    successResponse({
      id: Number(onboarding.id),
      candidate_id: onboarding.candidate_id,
      job_placement: onboarding.job_placement,
      document: onboarding.document,
      document_candidate: onboarding.document_candidate,
      facilities: (onboarding.facilities || []).map(f => ({
        id: Number(f.id),
        inventory_no: f.inventory_no,
        item: f.item,
        qty: f.qty,
        unit: f.unit,
        condition: f.condition,
        status: f.status
      })),
      programs: (onboarding.programs || []).map(p => ({
        id: Number(p.id),
        program: p.program,
        date: p.date,
        location: p.location,
        pic: p.pic,
        status: p.status
      })),
      onboarding_accepted_at: onboarding.onboardingAcceptedAt?.toISOString() || null,
      created_at: onboarding.createdAt?.toISOString() || null,
      updated_at: onboarding.updatedAt?.toISOString() || null
    })
  )
}
