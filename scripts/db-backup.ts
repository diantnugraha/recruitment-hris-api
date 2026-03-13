import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface DbConfig {
  host: string
  port: string
  user: string
  password: string
  database: string
}

function parseDatabaseUrl(url: string): DbConfig {
  // mysql://user:password@host:port/database
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
  const match = url.match(regex)

  if (!match) {
    throw new Error('Invalid DATABASE_URL format')
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

async function backup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is not set in environment')
    process.exit(1)
  }

  const config = parseDatabaseUrl(databaseUrl)
  const backupDir = resolve(__dirname, '..', 'backups')
  const timestamp = formatDate(new Date())
  const filename = `${config.database}_${timestamp}.sql`
  const filepath = resolve(backupDir, filename)

  // Create backup directory if not exists
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
    console.log(`Created backup directory: ${backupDir}`)
  }

  console.log('='.repeat(50))
  console.log('DATABASE BACKUP')
  console.log('='.repeat(50))
  console.log(`Database: ${config.database}`)
  console.log(`Host: ${config.host}:${config.port}`)
  console.log(`Output: ${filepath}`)
  console.log('='.repeat(50))

  try {
    // Build mysqldump command
    const command = [
      'mysqldump',
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--user=${config.user}`,
      `--password=${config.password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--add-drop-table',
      config.database,
      `--result-file="${filepath}"`
    ].join(' ')

    console.log('Running mysqldump...')
    execSync(command, { stdio: 'inherit' })

    console.log('')
    console.log('='.repeat(50))
    console.log('BACKUP COMPLETED SUCCESSFULLY!')
    console.log(`File: ${filepath}`)
    console.log('='.repeat(50))
  } catch (error) {
    console.error('')
    console.error('='.repeat(50))
    console.error('BACKUP FAILED!')
    console.error('='.repeat(50))

    if (error instanceof Error) {
      console.error('Error:', error.message)
    }

    console.error('')
    console.error('Troubleshooting:')
    console.error('1. Make sure mysqldump is installed and in PATH')
    console.error('2. Check your DATABASE_URL in .env file')
    console.error('3. Verify database connection credentials')
    console.error('')
    console.error('Alternative: Use MySQL Workbench or phpMyAdmin to export manually')

    process.exit(1)
  }
}

backup()
