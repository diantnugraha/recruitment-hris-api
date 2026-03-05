import type { FastifyInstance } from 'fastify'

import { healthRoutes } from './healthRoutes.js'
import { authRoutes } from './authRoutes.js'
import { userRestRoutes } from './userRestRoutes.js'
import { obsRoutes } from './obsRoutes.js'
import { divisionRoutes } from './divisionRoutes.js'
import { departmentRoutes } from './departmentRoutes.js'
import { jobLevelRoutes } from './jobLevelRoutes.js'
import { jobTitleRoutes } from './jobTitleRoutes.js'
import { employeeRoutes } from './employeeRoutes.js'
import { employeeBudgetRoutes } from './employeeBudgetRoutes.js'
import { candidateRoutes } from './candidateRoutes.js'
import { candidateAuthRoutes } from './candidateAuthRoutes.js'
import { employeeRequestRoutes } from './employeeRequestRoutes.js'
import { roleRoutes } from './roleRoutes.js'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(userRestRoutes, { prefix: '/v1/user-rest' })
  await app.register(obsRoutes, { prefix: '/v1/obs' })
  await app.register(divisionRoutes, { prefix: '/v1/division' })
  await app.register(departmentRoutes, { prefix: '/v1/department' })
  await app.register(jobLevelRoutes, { prefix: '/v1/job-level' })
  await app.register(jobTitleRoutes, { prefix: '/v1/job-title' })
  await app.register(employeeRoutes, { prefix: '/v1/employee' })
  await app.register(employeeBudgetRoutes, { prefix: '/v1/employee-budget' })
  await app.register(candidateRoutes, { prefix: '/v1/candidate' })
  await app.register(candidateAuthRoutes, { prefix: '/v1/candidate-auth' })
  await app.register(employeeRequestRoutes, { prefix: '/v1/employee-request' })
  await app.register(roleRoutes, { prefix: '/v1/role' })
}
