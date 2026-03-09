import type { FastifyInstance } from 'fastify'

import * as candidateController from '../controllers/candidateController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { IdParamSchema, type IdParam } from '../schemas/common.js'

// Body types for routes
type UpdateCandidateBody = {
  fullname?: string
  email?: string
  address?: string
  resident_status?: string
  birth_place?: string
  birth_date?: string
  religion?: string
  ethnic_group?: string
  id_no?: string
  tax_id?: string
  bpjs_id?: string
  citizenship?: string
  marrital_status?: string
  gender?: 'M' | 'F'
  mobile_phone?: string
  driving_license?: string
}

type LinkRequestBody = {
  employee_request_id: number
  job_title_id: number
}

type AssessmentUpdateBody = {
  status: 'PASSED' | 'FAILED'
  description: string
}

type InterviewUpdateBody = AssessmentUpdateBody & {
  scoring?: {
    relevance_of_experience: number
    training_undertaken: number
    technical_skills: number
    non_technical_skills: number
    communication_skills: number
    emotional_maturity: number
    understanding_of_position: number
    teamwork_ability: number
  }
  conclusion?: 'PROCEED' | 'RECOMMENDED' | 'REJECTED'
  key_competencies?: string | null
  interviewer_notes?: string | null
  assessed_by?: string | null
}

type ScoringQuery = {
  stage?: 'interview1' | 'interview2'
}

type OnboardingBody = {
  job_placement?: string
  document?: string
  document_candidate?: string
}

type FacilityBody = {
  inventory_no: string
  item: string
  qty: number
  unit: string
  condition: string
  status: string
}

type ProgramBody = {
  program: string
  date: string
  location: string
  pic: string
  status: string
}

type SendInvitationBody = {
  portal_base_url: string
}

export async function candidateRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // ==================== Candidate CRUD ====================

  // List candidates with filters and pagination
  app.get('/', candidateController.getAll)

  // Get candidate by ID
  app.get<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    candidateController.getById
  )

  // Get candidate biodata (education, work experience, family, training, self assessment)
  app.get<{ Params: IdParam }>(
    '/:id/biodata',
    { schema: { params: IdParamSchema } },
    candidateController.getBiodata
  )

  // Create new candidate
  app.post('/', candidateController.create)

  // Update candidate
  app.put<{ Params: IdParam; Body: UpdateCandidateBody }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    candidateController.update
  )

  // Delete candidate
  app.delete<{ Params: IdParam }>(
    '/:id',
    { schema: { params: IdParamSchema } },
    candidateController.remove
  )

  // Generate token for candidate portal access
  app.post<{ Params: IdParam }>(
    '/:id/generate-token',
    { schema: { params: IdParamSchema } },
    candidateController.generateToken
  )

  // Send invitation email to candidate
  app.post<{ Params: IdParam; Body: SendInvitationBody }>(
    '/:id/send-invitation',
    { schema: { params: IdParamSchema } },
    candidateController.sendInvitation
  )

  // Link candidate to employee request
  app.post<{ Params: IdParam; Body: LinkRequestBody }>(
    '/:id/link-request',
    { schema: { params: IdParamSchema } },
    candidateController.linkToEmployeeRequest
  )

  // ==================== Assessment Pipeline ====================

  // Get assessment progress (interview1, interview2, mcu status)
  app.get<{ Params: IdParam }>(
    '/:id/assessment',
    { schema: { params: IdParamSchema } },
    candidateController.getAssessmentProgress
  )

  // Start assessment (unlock interview process)
  app.post<{ Params: IdParam }>(
    '/:id/assessment/start',
    { schema: { params: IdParamSchema } },
    candidateController.startAssessment
  )

  // Update Interview HR
  app.put<{ Params: IdParam; Body: InterviewUpdateBody }>(
    '/:id/assessment/interview1',
    { schema: { params: IdParamSchema } },
    candidateController.updateInterview1
  )

  // Update Interview User
  app.put<{ Params: IdParam; Body: InterviewUpdateBody }>(
    '/:id/assessment/interview2',
    { schema: { params: IdParamSchema } },
    candidateController.updateInterview2
  )

  // Get assessment scoring data
  app.get<{ Params: IdParam; Querystring: ScoringQuery }>(
    '/:id/assessment/scoring',
    { schema: { params: IdParamSchema } },
    candidateController.getAssessmentScoring
  )

  // Update MCU
  app.put<{ Params: IdParam; Body: AssessmentUpdateBody }>(
    '/:id/assessment/mcu',
    { schema: { params: IdParamSchema } },
    candidateController.updateMcu
  )

  // MCU Document Upload
  app.post<{ Params: IdParam }>(
    '/:id/assessment/mcu/document',
    { schema: { params: IdParamSchema } },
    candidateController.uploadMcuDocument
  )

  // Get MCU Document (with presigned URL)
  app.get<{ Params: IdParam }>(
    '/:id/assessment/mcu/document',
    { schema: { params: IdParamSchema } },
    candidateController.getMcuDocument
  )

  // Delete MCU Document
  app.delete<{ Params: IdParam }>(
    '/:id/assessment/mcu/document',
    { schema: { params: IdParamSchema } },
    candidateController.deleteMcuDocument
  )

  // ==================== Onboarding ====================

  // Get onboarding data
  app.get<{ Params: IdParam }>(
    '/:id/onboarding',
    { schema: { params: IdParamSchema } },
    candidateController.getOnboarding
  )

  // Create onboarding (after all assessments passed)
  app.post<{ Params: IdParam; Body: OnboardingBody }>(
    '/:id/onboarding',
    { schema: { params: IdParamSchema } },
    candidateController.createOnboarding
  )

  // Update onboarding
  app.put<{ Params: IdParam; Body: OnboardingBody }>(
    '/:id/onboarding',
    { schema: { params: IdParamSchema } },
    candidateController.updateOnboarding
  )

  // ==================== Facilities ====================

  // Add facility
  app.post<{ Params: IdParam; Body: FacilityBody }>(
    '/:id/onboarding/facilities',
    { schema: { params: IdParamSchema } },
    candidateController.addFacility
  )

  // Update facility
  app.put<{ Params: { id: number; facilityId: number }; Body: Partial<FacilityBody> }>(
    '/:id/onboarding/facilities/:facilityId',
    candidateController.updateFacility
  )

  // Delete facility
  app.delete<{ Params: { id: number; facilityId: number } }>(
    '/:id/onboarding/facilities/:facilityId',
    candidateController.deleteFacility
  )

  // ==================== Programs ====================

  // Add program
  app.post<{ Params: IdParam; Body: ProgramBody }>(
    '/:id/onboarding/programs',
    { schema: { params: IdParamSchema } },
    candidateController.addProgram
  )

  // Update program
  app.put<{ Params: { id: number; programId: number }; Body: Partial<ProgramBody> }>(
    '/:id/onboarding/programs/:programId',
    candidateController.updateProgram
  )

  // Delete program
  app.delete<{ Params: { id: number; programId: number } }>(
    '/:id/onboarding/programs/:programId',
    candidateController.deleteProgram
  )

  // ==================== Convert to Employee ====================

  // Convert candidate to employee (after onboarding complete)
  app.post<{ Params: IdParam }>(
    '/:id/convert-to-employee',
    { schema: { params: IdParamSchema } },
    candidateController.convertToEmployee
  )
}
