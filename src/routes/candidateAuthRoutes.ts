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
  // POST /v1/candidate-auth/login - Login with email + token
  app.post('/login', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Candidate login with email and token',
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

  // POST /v1/candidate-auth/verify - Verify token validity
  app.post('/verify', {
    schema: {
      tags: ['Candidate Auth'],
      summary: 'Verify candidate token validity',
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        token: Type.String()
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
    handler: candidateAuthController.verifyToken
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
}
