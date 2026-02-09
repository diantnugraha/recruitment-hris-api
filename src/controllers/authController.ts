import type { FastifyRequest, FastifyReply } from 'fastify'

import * as authService from '../services/authService.js'
import type { LoginBody, RegisterBody } from '../schemas/authSchemas.js'

export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
): Promise<void> {
  const result = await authService.register(request.body)

  reply.status(201).send({
    success: true,
    data: result,
    message: 'User registered successfully'
  })
}

export async function login(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
): Promise<void> {
  const result = await authService.login(request.body)

  reply.send({
    success: true,
    data: result,
    message: 'Login successful'
  })
}

export async function me(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = await authService.getCurrentUser(request.user.userId)

  reply.send({
    success: true,
    data: user
  })
}
