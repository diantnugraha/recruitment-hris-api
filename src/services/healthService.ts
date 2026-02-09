import { prisma } from '../config/database.js'

export interface HealthStatus {
  status: 'ok' | 'error'
  timestamp: string
  database: 'connected' | 'disconnected'
}

export async function getHealthStatus(): Promise<HealthStatus> {
  let databaseStatus: 'connected' | 'disconnected' = 'disconnected'

  try {
    await prisma.$queryRaw`SELECT 1`
    databaseStatus = 'connected'
  } catch {
    databaseStatus = 'disconnected'
  }

  return {
    status: databaseStatus === 'connected' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    database: databaseStatus
  }
}
