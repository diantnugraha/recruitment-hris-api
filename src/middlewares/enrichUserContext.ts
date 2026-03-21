import type { FastifyRequest, FastifyReply } from 'fastify'

import { prisma } from '../config/database.js'

export interface EnrichedUser {
  userId: number
  email: string
  roleName: string
  employeeId: number | null
  managedDepartmentIds: number[]
  headOfDivisionIds: number[]
}

declare module 'fastify' {
  interface FastifyRequest {
    enrichedUser?: EnrichedUser
  }
}

export async function enrichUserContext(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const { userId, email, roleName } = request.user

  const user = await prisma.user.findFirst({
    where: { id: userId, trash: null },
    select: {
      employeeId: true,
      employee: {
        select: {
          managedDepartments: { select: { id: true } },
          headOfDivisions: { select: { id: true } },
        },
      },
    },
  })

  const employeeId = user?.employeeId ?? null
  const managedDepartmentIds = user?.employee?.managedDepartments.map(d => d.id) ?? []
  const headOfDivisionIds = user?.employee?.headOfDivisions.map(d => d.id) ?? []

  request.enrichedUser = {
    userId,
    email,
    roleName,
    employeeId,
    managedDepartmentIds,
    headOfDivisionIds,
  }
}
