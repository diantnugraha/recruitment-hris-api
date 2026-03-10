import type { FastifyInstance } from 'fastify'
import { Type } from '@sinclair/typebox'

import * as candidateProfileController from '../controllers/candidateProfileController.js'
import { authenticateCandidate } from '../middlewares/candidateAuthMiddleware.js'
import {
  EducationalBackgroundInputSchema,
  EducationalBackgroundResponseSchema,
  WorkExperienceInputSchema,
  WorkExperienceResponseSchema,
  FamilyMemberInputSchema,
  FamilyMemberResponseSchema,
  CourseTrainingInputSchema,
  CourseTrainingResponseSchema,
  AssessmentInputSchema,
  AssessmentResponseSchema
} from '../schemas/candidateProfileSchemas.js'

export async function candidateProfileRoutes(app: FastifyInstance): Promise<void> {
  // ==================== EDUCATIONAL BACKGROUND ====================

  // GET /v1/candidate-profile/education
  app.get('/education', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate educational background',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(EducationalBackgroundResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getEducation
  })

  // PUT /v1/candidate-profile/education
  app.put('/education', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Save candidate educational background (replaces all)',
      security: [{ bearerAuth: [] }],
      body: EducationalBackgroundInputSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(EducationalBackgroundResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.saveEducation
  })

  // ==================== WORK EXPERIENCE ====================

  // GET /v1/candidate-profile/work-experience
  app.get('/work-experience', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate work experience',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(WorkExperienceResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getWorkExperience
  })

  // PUT /v1/candidate-profile/work-experience
  app.put('/work-experience', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Save candidate work experience (replaces all)',
      security: [{ bearerAuth: [] }],
      body: WorkExperienceInputSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(WorkExperienceResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.saveWorkExperience
  })

  // ==================== FAMILY MEMBERS ====================

  // GET /v1/candidate-profile/family
  app.get('/family', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate family members',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(FamilyMemberResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getFamily
  })

  // PUT /v1/candidate-profile/family
  app.put('/family', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Save candidate family members (replaces all)',
      security: [{ bearerAuth: [] }],
      body: FamilyMemberInputSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(FamilyMemberResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.saveFamily
  })

  // ==================== COURSE/TRAINING ====================

  // GET /v1/candidate-profile/training
  app.get('/training', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate training/courses',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(CourseTrainingResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getTraining
  })

  // PUT /v1/candidate-profile/training
  app.put('/training', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Save candidate training/courses (replaces all)',
      security: [{ bearerAuth: [] }],
      body: CourseTrainingInputSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(CourseTrainingResponseSchema)
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.saveTraining
  })

  // ==================== ASSESSMENT ====================

  // GET /v1/candidate-profile/assessment
  app.get('/assessment', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate self assessment',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: AssessmentResponseSchema
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getAssessment
  })

  // PUT /v1/candidate-profile/assessment
  app.put('/assessment', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Save candidate self assessment',
      security: [{ bearerAuth: [] }],
      body: AssessmentInputSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: AssessmentResponseSchema
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.saveAssessment
  })

  // ==================== SUBMIT BIODATA ====================

  // POST /v1/candidate-profile/submit
  app.post('/submit', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Submit candidate biodata (marks biodata as completed)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Null(),
          message: Type.String()
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.submitBiodata
  })

  // ==================== INTERVIEW PROGRESS (Read-Only) ====================

  // GET /v1/candidate-profile/interview-progress
  app.get('/interview-progress', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate interview progress (read-only, managed by HR)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Union([
            Type.Object({
              interview1: Type.Object({
                status: Type.String(),
                passed: Type.Boolean(),
                failed: Type.Boolean(),
                pending: Type.Boolean(),
                locked: Type.Boolean(),
                description: Type.String()
              }),
              interview2: Type.Object({
                status: Type.String(),
                passed: Type.Boolean(),
                failed: Type.Boolean(),
                pending: Type.Boolean(),
                locked: Type.Boolean(),
                description: Type.String()
              }),
              current_stage: Type.String(),
              interview_started: Type.Boolean(),
              interview_started_at: Type.Union([Type.String(), Type.Null()]),
              interview_date: Type.Union([Type.String(), Type.Null()]),
              interview_type: Type.Union([Type.String(), Type.Null()]),
              all_passed: Type.Boolean(),
              any_failed: Type.Boolean()
            }),
            Type.Null()
          ])
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getInterviewProgress
  })

  // ==================== MCU STATUS (Read-Only) ====================

  // GET /v1/candidate-profile/mcu-status
  app.get('/mcu-status', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate MCU status (read-only, managed by HR)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Union([
            Type.Object({
              status: Type.String(),
              description: Type.String(),
              document_url: Type.Union([Type.String(), Type.Null()]),
              document_name: Type.Union([Type.String(), Type.Null()])
            }),
            Type.Null()
          ])
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getMcuStatus
  })

  // ==================== ONBOARDING (Read-Only) ====================

  // GET /v1/candidate-profile/onboarding
  app.get('/onboarding', {
    schema: {
      tags: ['Candidate Profile'],
      summary: 'Get candidate onboarding data (read-only, managed by HR)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Union([
            Type.Object({
              id: Type.Number(),
              candidate_id: Type.Number(),
              job_placement: Type.String(),
              document: Type.String(),
              document_candidate: Type.String(),
              facilities: Type.Array(Type.Object({
                id: Type.Number(),
                inventory_no: Type.String(),
                item: Type.String(),
                qty: Type.Number(),
                unit: Type.String(),
                condition: Type.String(),
                status: Type.String()
              })),
              programs: Type.Array(Type.Object({
                id: Type.Number(),
                program: Type.String(),
                date: Type.String(),
                location: Type.String(),
                pic: Type.String(),
                status: Type.String()
              })),
              created_at: Type.Union([Type.String(), Type.Null()]),
              updated_at: Type.Union([Type.String(), Type.Null()])
            }),
            Type.Null()
          ])
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateProfileController.getOnboarding
  })
}
