import type { FastifyRequest, FastifyReply } from 'fastify'

import * as authService from '../services/authService.js'
import type { LoginBody, RegisterBody } from '../schemas/authSchemas.js'

const COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 3 * 24 * 60 * 60 // 3 days in seconds (matches JWT expiry)

function setAuthCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
): Promise<void> {
  const result = await authService.register(request.body)

  setAuthCookie(reply, result.token)

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

  setAuthCookie(reply, result.token)

  reply.send({
    success: true,
    data: result,
    message: 'Login successful'
  })
}

export async function logout(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  reply.clearCookie(COOKIE_NAME, { path: '/' })

  reply.send({
    success: true,
    message: 'Logged out successfully'
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
