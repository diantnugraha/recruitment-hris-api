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
}
