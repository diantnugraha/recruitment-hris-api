import type { FastifyInstance } from 'fastify'

import * as candidateAuthController from '../controllers/candidateAuthController.js'
import { authenticateCandidate } from '../middlewares/candidateAuthMiddleware.js'
import {
  CandidateLoginBodySchema,
  CandidateProfileUpdateSchema,
  CandidateAuthResponseSchema,
  CandidateResponseSchema
} from '../schemas/candidateAuthSchemas.js'
import { Type } from '@sinclair/typebox'

export async function candidateAuthRoutes(app: FastifyInstance): Promise<void> {
  // POST /v1/candidate-auth/login - Login with email + password
  app.post('/login', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Candidate login with email and password',
      body: CandidateLoginBodySchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: CandidateAuthResponseSchema
        })
      }
    },
    handler: candidateAuthController.login
  })

  // POST /v1/candidate-auth/verify - Verify password validity
  app.post('/verify', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Verify candidate password validity',
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            valid: Type.Boolean()
          })
        })
      }
    },
    handler: candidateAuthController.verifyPassword
  })

  // GET /v1/candidate-auth/profile - Get authenticated candidate profile
  app.get('/profile', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Get candidate profile (requires auth)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: CandidateResponseSchema
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateAuthController.getProfile
  })

  // PUT /v1/candidate-auth/profile - Update candidate profile
  app.put('/profile', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Update candidate profile (requires auth)',
      security: [{ bearerAuth: [] }],
      body: CandidateProfileUpdateSchema,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: CandidateResponseSchema
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateAuthController.updateProfile
  })

  // POST /v1/candidate-auth/agreement - Accept data consent agreement
  app.post('/agreement', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Accept data consent agreement (requires auth)',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        version: Type.Optional(Type.String())
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: CandidateResponseSchema
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateAuthController.acceptAgreement
  })

  // POST /v1/candidate-auth/accept-onboarding - Accept onboarding offer
  app.post('/accept-onboarding', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Accept onboarding offer (requires auth)',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.Number(),
            candidateId: Type.Number(),
            employeeRequestId: Type.Number(),
            jobPlacement: Type.String(),
            document: Type.String(),
            documentCandidate: Type.String(),
            onboardingAcceptedAt: Type.Union([Type.String(), Type.Null()]),
            facilities: Type.Array(Type.Object({
              id: Type.Number(),
              inventoryNo: Type.String(),
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
            }))
          })
        })
      }
    },
    preHandler: authenticateCandidate,
    handler: candidateAuthController.acceptOnboarding
  })
}
