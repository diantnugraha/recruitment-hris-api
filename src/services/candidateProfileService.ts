import type {
  candidate_recruitment_educational_background,
  candidate_recruitment_work_experiences,
  candidate_recruitment_family_members,
  candidate_recruitment_course_experience,
  candidate_recruitment_assessment
} from '@prisma/client'

import * as candidateProfileRepository from '../repositories/candidateProfileRepository.js'
import * as candidateDetailRepository from '../repositories/candidateDetailRepository.js'
import * as candidateAssessmentRepository from '../repositories/candidateAssessmentRepository.js'
import * as onboardingRepository from '../repositories/onboardingRepository.js'
import { BadRequestError, NotFoundError } from '../errors/index.js'
import * as candidateRepository from '../repositories/candidateRepository.js'
import { sendRecruitmentNotification } from './recruitmentNotificationHelper.js'
import { RECRUITMENT_NOTIFICATION_TYPE } from '../constants/recruitmentNotificationConstants.js'

// ==================== EDUCATIONAL BACKGROUND ====================

export async function getEducation(
  candidateId: number
): Promise<candidate_recruitment_educational_background[]> {
  const result = await candidateProfileRepository.findEducationByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch education')
  }

  return result.getValue()
}

export async function saveEducation(
  candidateId: number,
  items: Array<{
    school_university: string
    city: string
    degree: string
    major: string
    year_graduate: number
  }>
): Promise<candidate_recruitment_educational_background[]> {
  const mappedItems = items.map((item) => ({
    schoolUniversity: item.school_university,
    city: item.city,
    degree: item.degree,
    major: item.major,
    yearGraduate: item.year_graduate
  }))

  const result = await candidateProfileRepository.replaceEducation(candidateId, mappedItems)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to save education')
  }

  return result.getValue()
}

// ==================== WORK EXPERIENCE ====================

export async function getWorkExperience(
  candidateId: number
): Promise<candidate_recruitment_work_experiences[]> {
  const result = await candidateProfileRepository.findWorkExperienceByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch work experience')
  }

  return result.getValue()
}

export async function saveWorkExperience(
  candidateId: number,
  items: Array<{
    company: string
    city: string
    job_title: string
    period: string
    length_of_working: string
  }>
): Promise<candidate_recruitment_work_experiences[]> {
  const mappedItems = items.map((item) => ({
    company: item.company,
    city: item.city,
    jobTitle: item.job_title,
    period: item.period,
    lengthOfWorking: item.length_of_working
  }))

  const result = await candidateProfileRepository.replaceWorkExperience(candidateId, mappedItems)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to save work experience')
  }

  return result.getValue()
}

// ==================== FAMILY MEMBERS ====================

export async function getFamily(
  candidateId: number
): Promise<candidate_recruitment_family_members[]> {
  const result = await candidateProfileRepository.findFamilyByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch family members')
  }

  return result.getValue()
}

export async function saveFamily(
  candidateId: number,
  items: Array<{
    name: string
    relation: string
    age: number
    education: string
    work: string
  }>
): Promise<candidate_recruitment_family_members[]> {
  const mappedItems = items.map((item) => ({
    name: item.name,
    relation: item.relation,
    age: item.age,
    education: item.education,
    work: item.work
  }))

  const result = await candidateProfileRepository.replaceFamily(candidateId, mappedItems)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to save family members')
  }

  return result.getValue()
}

// ==================== COURSE/TRAINING ====================

export async function getTraining(
  candidateId: number
): Promise<candidate_recruitment_course_experience[]> {
  const result = await candidateProfileRepository.findTrainingByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch training')
  }

  return result.getValue()
}

export async function saveTraining(
  candidateId: number,
  items: Array<{
    course_topic: string
    provider: string
    year: number
    city: string
    certificate: string
  }>
): Promise<candidate_recruitment_course_experience[]> {
  const mappedItems = items.map((item) => ({
    courseTopic: item.course_topic,
    provider: item.provider,
    year: item.year,
    city: item.city,
    certificate: item.certificate
  }))

  const result = await candidateProfileRepository.replaceTraining(candidateId, mappedItems)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to save training')
  }

  return result.getValue()
}

// ==================== ASSESSMENT ====================

export async function getAssessment(
  candidateId: number
): Promise<candidate_recruitment_assessment | null> {
  const result = await candidateProfileRepository.findAssessmentByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch assessment')
  }

  return result.getValue()
}

export async function saveAssessment(
  candidateId: number,
  data: {
    reason_leaving_last_job?: string
    last_job_description?: string
    reason_applying?: string
    relevant_skills?: string
    last_salary?: string
    expected_salary?: string
    active_language?: string
    willing_to_transfer?: string
    willing_to_double_work?: string
    known_employees?: string
    ready_to_work?: string
    employee_relationship?: string
    reference_contact_name?: string
    reference_contact_phone?: string
  }
): Promise<candidate_recruitment_assessment> {
  // Get candidate detail ID (required for assessment)
  const detailResult = await candidateProfileRepository.findDetailByCandidateId(candidateId)

  if (detailResult.isFailure()) {
    throw new BadRequestError(detailResult.getError() || 'Failed to fetch candidate detail')
  }

  // Use detail ID if available, otherwise use 0 (will be updated later when detail is created)
  const detailId = detailResult.getValue()?.id ?? 0

  const mappedData = {
    reasonLeavingLastJob: data.reason_leaving_last_job ?? '',
    lastJobDescription: data.last_job_description ?? '',
    reasonApplying: data.reason_applying ?? '',
    relevantSkills: data.relevant_skills ?? '',
    lastSalary: data.last_salary ?? '',
    expectedSalary: data.expected_salary ?? '',
    activeLanguage: data.active_language ?? '',
    willingToTransfer: data.willing_to_transfer ?? '',
    willingToDoubleWork: data.willing_to_double_work ?? '',
    knownEmployees: data.known_employees ?? '',
    readyToWork: data.ready_to_work ?? '',
    employeeRelationship: data.employee_relationship ?? '',
    referenceContactName: data.reference_contact_name ?? '',
    referenceContactPhone: data.reference_contact_phone ?? ''
  }

  const result = await candidateProfileRepository.upsertAssessment(candidateId, detailId, mappedData)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to save assessment')
  }

  return result.getValue()
}

// ==================== SUBMIT BIODATA ====================

export async function submitBiodata(candidateId: number): Promise<void> {
  const detailResult = await candidateProfileRepository.findDetailByCandidateId(candidateId)

  if (detailResult.isFailure()) {
    throw new BadRequestError(detailResult.getError() || 'Failed to fetch candidate detail')
  }

  const detail = detailResult.getValue()
  if (!detail) {
    throw new NotFoundError('Candidate detail not found')
  }

  const result = await candidateDetailRepository.verifyCandidate(detail.id)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to submit biodata')
  }

  // Send notification to HR who invited the candidate
  try {
    const invitedBy = await candidateDetailRepository.getInvitedBy(candidateId)
    if (invitedBy) {
      const candidateResult = await candidateRepository.findById(candidateId)
      const candidateName = candidateResult.isSuccess()
        ? candidateResult.getValue()?.fullname || 'Unknown'
        : 'Unknown'

      await sendRecruitmentNotification({
        type: RECRUITMENT_NOTIFICATION_TYPE.BIODATA_SUBMITTED,
        candidateId,
        candidateName,
        targetUserIds: [invitedBy],
      })
    }
  } catch (err) {
    console.error('[NOTIFICATION] Failed to send biodata submitted notification:', err)
  }
}

// ==================== INTERVIEW PROGRESS ====================

export async function getInterviewProgress(candidateId: number) {
  const result = await candidateAssessmentRepository.getProgress(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch interview progress')
  }

  return result.getValue()
}

// ==================== MCU STATUS ====================

export async function getMcuStatus(candidateId: number) {
  const result = await candidateAssessmentRepository.findByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch MCU status')
  }

  return result.getValue()
}

// ==================== ONBOARDING ====================

export async function getOnboarding(candidateId: number) {
  const result = await onboardingRepository.findOnboardingByCandidateId(candidateId)

  if (result.isFailure()) {
    throw new BadRequestError(result.getError() || 'Failed to fetch onboarding data')
  }

  return result.getValue()
}
