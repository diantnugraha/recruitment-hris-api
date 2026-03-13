import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
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

function listBackups(backupDir: string): string[] {
  if (!existsSync(backupDir)) {
    return []
  }

  return readdirSync(backupDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse()
}

async function restore(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  const backupFile = process.argv[2]

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is not set in environment')
    process.exit(1)
  }

  const config = parseDatabaseUrl(databaseUrl)
  const backupDir = resolve(__dirname, '..', 'backups')

  // If no backup file specified, list available backups
  if (!backupFile) {
    console.log('='.repeat(50))
    console.log('AVAILABLE BACKUPS')
    console.log('='.repeat(50))

    const backups = listBackups(backupDir)

    if (backups.length === 0) {
      console.log('No backup files found in:', backupDir)
      console.log('')
      console.log('Run backup first: npm run db:backup')
    } else {
      console.log('Backup files:')
      backups.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`)
      })
      console.log('')
      console.log('Usage: npm run db:restore <filename>')
      console.log('Example: npm run db:restore ' + backups[0])
    }

    process.exit(0)
  }

  // Resolve backup file path
  const filepath = backupFile.includes('/') || backupFile.includes('\\')
    ? resolve(backupFile)
    : resolve(backupDir, backupFile)

  if (!existsSync(filepath)) {
    console.error('ERROR: Backup file not found:', filepath)
    process.exit(1)
  }

  console.log('='.repeat(50))
  console.log('DATABASE RESTORE')
  console.log('='.repeat(50))
  console.log(`Database: ${config.database}`)
  console.log(`Host: ${config.host}:${config.port}`)
  console.log(`File: ${filepath}`)
  console.log('='.repeat(50))
  console.log('')
  console.log('WARNING: This will OVERWRITE all data in the database!')
  console.log('Press Ctrl+C within 5 seconds to cancel...')
  console.log('')

  // Wait 5 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 5000))

  try {
    console.log('Restoring database...')

    // Build mysql command
    const command = [
      'mysql',
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--user=${config.user}`,
      `--password=${config.password}`,
      config.database,
      `< "${filepath}"`
    ].join(' ')

    execSync(command, { stdio: 'inherit', shell: 'bash' })

    console.log('')
    console.log('='.repeat(50))
    console.log('RESTORE COMPLETED SUCCESSFULLY!')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('')
    console.error('='.repeat(50))
    console.error('RESTORE FAILED!')
    console.error('='.repeat(50))

    if (error instanceof Error) {
      console.error('Error:', error.message)
    }

    process.exit(1)
  }
}

restore()
