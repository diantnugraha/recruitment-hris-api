import 'dotenv/config'
import { createApp } from './config/app.js'

const PORT = Number(process.env.PORT) || 3000
const HOST = '0.0.0.0'

function printBanner(startTime: bigint): void {
  const elapsed = Number(process.hrtime.bigint() - startTime) / 1e6
  const env = process.env.NODE_ENV ?? 'development'
  const nodeVersion = process.version

  const lines = [
    '',
    '  ╔══════════════════════════════════════════════════╗',
    '  ║                                                  ║',
    '  ║   🚀  Recruitment HRIS API                       ║',
    '  ║                                                  ║',
    '  ╠══════════════════════════════════════════════════╣',
    '  ║                                                  ║',
    `  ║   ➜  Local:    http://localhost:${PORT}             ║`,
    `  ║   ➜  Network:  http://${HOST}:${PORT}             ║`,
    '  ║                                                  ║',
    '  ╠══════════════════════════════════════════════════╣',
    '  ║                                                  ║',
    `  ║   Environment:  ${env.padEnd(33)}║`,
    `  ║   Node:         ${nodeVersion.padEnd(33)}║`,
    `  ║   Fastify:      v5                               ║`,
    `  ║   Started in:   ${(elapsed.toFixed(0) + 'ms').padEnd(33)}║`,
    '  ║                                                  ║',
    '  ╚══════════════════════════════════════════════════╝',
    '',
  ]

  for (const line of lines) {
    process.stdout.write(line + '\n')
  }
}

async function start(): Promise<void> {
  const startTime = process.hrtime.bigint()
  const app = await createApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    printBanner(startTime)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
