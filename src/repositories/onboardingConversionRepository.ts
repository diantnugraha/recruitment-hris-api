import type { Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

/**
 * Owns the atomic transaction that runs when a candidate accepts onboarding:
 *   1. Mark candidate_recruitment_onboarding.onboarding_accepted_at = NOW
 *   2. Mark employee_request.status_employee_request = 7 (completed)
 *   3. Insert employee_list row
 *   4. Insert users row (linked to the new employee)
 *
 * Either ALL four writes succeed, or none of them do. The service builds the
 * payload (validation, password hashing, role lookup) and hands it here so the
 * Prisma access stays localized to the repository layer.
 */

export type ConversionPayload = {
  candidateId: number
  onboardingId: bigint
  employeeRequestId: number | null
  employee: Prisma.EmployeeCreateInput
  user: Omit<Prisma.UserUncheckedCreateInput, 'employeeId'>
}

export type ConversionResult = {
  employeeId: number
  userId: number
}

export async function acceptOnboardingAndConvert(
  payload: ConversionPayload
): Promise<RepositoryResult<ConversionResult>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark onboarding accepted
      await tx.candidate_recruitment_onboarding.update({
        where: { id: payload.onboardingId },
        data: {
          onboardingAcceptedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // 2. Mark the employee request as completed (status 7) — only if there
      //    is an associated request. Walk-in candidates may not have one.
      if (payload.employeeRequestId !== null) {
        await tx.employeeRequest.update({
          where: { id: payload.employeeRequestId },
          data: { statusEmployeeRequest: 7 }
        })
      }

      // 3. Create the employee row. Employee.create input already carries
      //    sane defaults for the NOT NULL columns (uuid, employeeStatus,
      //    superiorId) — caller is responsible for ensuring those are set.
      const employee = await tx.employee.create({
        data: payload.employee,
        select: { employeeId: true }
      })

      // 4. Create the user row linked to the new employee. Password is
      //    expected to be pre-hashed by the caller.
      const user = await tx.user.create({
        data: {
          ...payload.user,
          employeeId: employee.employeeId
        },
        select: { id: true }
      })

      return {
        employeeId: employee.employeeId,
        userId: user.id
      }
    })

    return success(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to convert candidate to employee'
    return failure(message)
  }
}
