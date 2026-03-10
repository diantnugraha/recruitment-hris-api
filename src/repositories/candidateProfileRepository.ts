import type {
  candidate_recruitment_educational_background,
  candidate_recruitment_work_experiences,
  candidate_recruitment_family_members,
  candidate_recruitment_course_experience,
  candidate_recruitment_assessment
} from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

// ==================== TYPES ====================

export type EducationalBackgroundData = {
  schoolUniversity: string
  city: string
  degree: string
  major: string
  yearGraduate: number
}

export type WorkExperienceData = {
  company: string
  city: string
  jobTitle: string
  period: string
  lengthOfWorking: string
}

export type FamilyMemberData = {
  name: string
  relation: string
  age: number
  education: string
  work: string
}

export type CourseTrainingData = {
  courseTopic: string
  provider: string
  year: number
  city: string
  certificate: string
}

export type AssessmentData = {
  reasonLeavingLastJob?: string
  lastJobDescription?: string
  reasonApplying?: string
  relevantSkills?: string
  lastSalary?: string
  expectedSalary?: string
  activeLanguage?: string
  willingToTransfer?: string
  willingToDoubleWork?: string
  knownEmployees?: string
  readyToWork?: string
  employeeRelationship?: string
  referenceContactName?: string
  referenceContactPhone?: string
}

// ==================== EDUCATIONAL BACKGROUND ====================

export async function findEducationByCandidateId(
  candidateId: number
): Promise<RepositoryResult<candidate_recruitment_educational_background[]>> {
  try {
    const items = await prisma.candidate_recruitment_educational_background.findMany({
      where: { candidate_id: candidateId },
      orderBy: { year_graduate: 'desc' }
    })
    return success(items)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch education'
    return failure(message)
  }
}

export async function replaceEducation(
  candidateId: number,
  items: EducationalBackgroundData[]
): Promise<RepositoryResult<candidate_recruitment_educational_background[]>> {
  try {
    // Delete existing records
    await prisma.candidate_recruitment_educational_background.deleteMany({
      where: { candidate_id: candidateId }
    })

    // Insert new records
    if (items.length > 0) {
      await prisma.candidate_recruitment_educational_background.createMany({
        data: items.map((item) => ({
          candidate_id: candidateId,
          school_university: item.schoolUniversity,
          city: item.city,
          degree: item.degree,
          major: item.major,
          year_graduate: item.yearGraduate
        }))
      })
    }

    // Return updated records
    const updated = await prisma.candidate_recruitment_educational_background.findMany({
      where: { candidate_id: candidateId },
      orderBy: { year_graduate: 'desc' }
    })

    return success(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save education'
    return failure(message)
  }
}

// ==================== WORK EXPERIENCE ====================

export async function findWorkExperienceByCandidateId(
  candidateId: number
): Promise<RepositoryResult<candidate_recruitment_work_experiences[]>> {
  try {
    const items = await prisma.candidate_recruitment_work_experiences.findMany({
      where: { candidate_id: candidateId },
      orderBy: { createdAt: 'desc' }
    })
    return success(items)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch work experience'
    return failure(message)
  }
}

export async function replaceWorkExperience(
  candidateId: number,
  items: WorkExperienceData[]
): Promise<RepositoryResult<candidate_recruitment_work_experiences[]>> {
  try {
    // Delete existing records
    await prisma.candidate_recruitment_work_experiences.deleteMany({
      where: { candidate_id: candidateId }
    })

    // Insert new records
    if (items.length > 0) {
      await prisma.candidate_recruitment_work_experiences.createMany({
        data: items.map((item) => ({
          candidate_id: candidateId,
          company: item.company,
          city: item.city,
          job_title: item.jobTitle,
          period: item.period,
          length_of_working: item.lengthOfWorking
        }))
      })
    }

    // Return updated records
    const updated = await prisma.candidate_recruitment_work_experiences.findMany({
      where: { candidate_id: candidateId },
      orderBy: { createdAt: 'desc' }
    })

    return success(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save work experience'
    return failure(message)
  }
}

// ==================== FAMILY MEMBERS ====================

export async function findFamilyByCandidateId(
  candidateId: number
): Promise<RepositoryResult<candidate_recruitment_family_members[]>> {
  try {
    const items = await prisma.candidate_recruitment_family_members.findMany({
      where: { candidate_id: candidateId },
      orderBy: { createdAt: 'asc' }
    })
    return success(items)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch family members'
    return failure(message)
  }
}

export async function replaceFamily(
  candidateId: number,
  items: FamilyMemberData[]
): Promise<RepositoryResult<candidate_recruitment_family_members[]>> {
  try {
    // Delete existing records
    await prisma.candidate_recruitment_family_members.deleteMany({
      where: { candidate_id: candidateId }
    })

    // Insert new records
    if (items.length > 0) {
      await prisma.candidate_recruitment_family_members.createMany({
        data: items.map((item) => ({
          candidate_id: candidateId,
          name: item.name,
          relation: item.relation,
          age: item.age,
          education: item.education,
          work: item.work
        }))
      })
    }

    // Return updated records
    const updated = await prisma.candidate_recruitment_family_members.findMany({
      where: { candidate_id: candidateId },
      orderBy: { createdAt: 'asc' }
    })

    return success(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save family members'
    return failure(message)
  }
}

// ==================== COURSE/TRAINING ====================

export async function findTrainingByCandidateId(
  candidateId: number
): Promise<RepositoryResult<candidate_recruitment_course_experience[]>> {
  try {
    const items = await prisma.candidate_recruitment_course_experience.findMany({
      where: { candidate_id: candidateId },
      orderBy: { year: 'desc' }
    })
    return success(items)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch training'
    return failure(message)
  }
}

export async function replaceTraining(
  candidateId: number,
  items: CourseTrainingData[]
): Promise<RepositoryResult<candidate_recruitment_course_experience[]>> {
  try {
    // Delete existing records
    await prisma.candidate_recruitment_course_experience.deleteMany({
      where: { candidate_id: candidateId }
    })

    // Insert new records
    if (items.length > 0) {
      await prisma.candidate_recruitment_course_experience.createMany({
        data: items.map((item) => ({
          candidate_id: candidateId,
          course_topic: item.courseTopic,
          provider: item.provider,
          year: item.year,
          city: item.city,
          certificate: item.certificate
        }))
      })
    }

    // Return updated records
    const updated = await prisma.candidate_recruitment_course_experience.findMany({
      where: { candidate_id: candidateId },
      orderBy: { year: 'desc' }
    })

    return success(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save training'
    return failure(message)
  }
}

// ==================== ASSESSMENT ====================

export async function findAssessmentByCandidateId(
  candidateId: number
): Promise<RepositoryResult<candidate_recruitment_assessment | null>> {
  try {
    const item = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId },
      orderBy: { createdAt: 'desc' }
    })
    return success(item)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch assessment'
    return failure(message)
  }
}

export async function upsertAssessment(
  candidateId: number,
  detailId: number,
  data: AssessmentData
): Promise<RepositoryResult<candidate_recruitment_assessment>> {
  try {
    // Find existing assessment
    const existing = await prisma.candidate_recruitment_assessment.findFirst({
      where: { candidate_id: candidateId }
    })

    if (existing) {
      // Update existing
      const updated = await prisma.candidate_recruitment_assessment.update({
        where: { id: existing.id },
        data: {
          reason_to_move: data.reasonLeavingLastJob ?? existing.reason_to_move,
          last_job_description: data.lastJobDescription ?? existing.last_job_description,
          purpose_of_applying: data.reasonApplying ?? existing.purpose_of_applying,
          tasks_jobs: data.relevantSkills ?? existing.tasks_jobs,
          last_salary: data.lastSalary ?? existing.last_salary,
          expected_salary: data.expectedSalary ?? existing.expected_salary,
          active_language: data.activeLanguage ?? existing.active_language,
          rotate_work: data.willingToTransfer ?? existing.rotate_work,
          loyality: data.willingToDoubleWork ?? existing.loyality,
          employees_you_know: data.knownEmployees ?? existing.employees_you_know,
          when_ready_work: data.readyToWork ?? existing.when_ready_work,
          relationship_with_the_employee: data.employeeRelationship ?? existing.relationship_with_the_employee,
          ref_contact_name: data.referenceContactName ?? existing.ref_contact_name,
          ref_mobile_phone: data.referenceContactPhone ?? existing.ref_mobile_phone,
          updatedAt: new Date()
        }
      })
      return success(updated)
    } else {
      // Create new
      const created = await prisma.candidate_recruitment_assessment.create({
        data: {
          candidate_id: candidateId,
          candidate_recruitment_detail_id: detailId,
          reason_to_move: data.reasonLeavingLastJob ?? '',
          last_job_description: data.lastJobDescription ?? '',
          purpose_of_applying: data.reasonApplying ?? '',
          tasks_jobs: data.relevantSkills ?? '',
          last_salary: data.lastSalary ?? '',
          expected_salary: data.expectedSalary ?? '',
          active_language: data.activeLanguage ?? '',
          rotate_work: data.willingToTransfer ?? '',
          loyality: data.willingToDoubleWork ?? '',
          employees_you_know: data.knownEmployees ?? '',
          when_ready_work: data.readyToWork ?? '',
          relationship_with_the_employee: data.employeeRelationship ?? '',
          ref_contact_name: data.referenceContactName ?? '',
          ref_mobile_phone: data.referenceContactPhone ?? '',
          // Default values for required fields
          interview1_desc: '',
          interview1_status: 'PENDING',
          interview2_desc: '',
          interview2_status: 'PENDING',
          mcu_desc: '',
          mcu_status: 'PENDING',
          assessment_assigned_to: ''
        }
      })
      return success(created)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save assessment'
    return failure(message)
  }
}

// ==================== DETAIL (for assessment reference) ====================

export async function findDetailByCandidateId(
  candidateId: number
): Promise<RepositoryResult<{ id: number } | null>> {
  try {
    const detail = await prisma.candidate_recruitment_detail.findFirst({
      where: { candidate_id: candidateId },
      select: { id: true }
    })
    return success(detail ? { id: Number(detail.id) } : null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch detail'
    return failure(message)
  }
}
