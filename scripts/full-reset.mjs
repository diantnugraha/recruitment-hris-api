import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function dropForeignKey(table, constraint) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraint}\``)
    console.log(`Dropped FK: ${constraint}`)
  } catch (e) {
    console.log(`FK ${constraint} not found (OK)`)
  }
}

async function dropIndex(table, index) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` DROP INDEX \`${index}\``)
    console.log(`Dropped index: ${index}`)
  } catch (e) {
    console.log(`Index ${index} not found (OK)`)
  }
}

async function dropColumn(table, column) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``)
    console.log(`Dropped column: ${table}.${column}`)
  } catch (e) {
    console.log(`Column ${table}.${column} not found (OK)`)
  }
}

async function main() {
  console.log('=== FULL RESET: Undoing partial migration ===\n')

  // 1. Drop foreign keys
  console.log('--- Dropping foreign keys ---')
  await dropForeignKey('divisions', 'divisions_obs_id_fkey')
  await dropForeignKey('divisions', 'divisions_head_of_division_id_fkey')
  await dropForeignKey('divisions', 'divisions_deputy_head_id_fkey')
  await dropForeignKey('departments', 'departments_manager_id_fkey')
  await dropForeignKey('employee_list', 'employee_list_department_id_fkey')

  // 2. Drop indexes
  console.log('\n--- Dropping indexes ---')
  await dropIndex('divisions', 'divisions_obs_id_idx')
  await dropIndex('divisions', 'divisions_is_management_idx')
  await dropIndex('divisions', 'divisions_head_of_division_id_key')
  await dropIndex('divisions', 'divisions_deputy_head_id_key')
  await dropIndex('departments', 'departments_manager_id_key')
  await dropIndex('obs', 'obs_code_idx')
  await dropIndex('employee_list', 'employee_list_department_id_idx')
  await dropIndex('users', 'users_employee_id_key')

  // 3. Drop columns
  console.log('\n--- Dropping columns ---')
  await dropColumn('divisions', 'obs_id')
  await dropColumn('divisions', 'is_management')
  await dropColumn('divisions', 'head_of_division_id')
  await dropColumn('divisions', 'deputy_head_id')
  await dropColumn('departments', 'manager_id')
  await dropColumn('employee_list', 'department_id')
  await dropColumn('obs', 'code')

  // 4. Delete Default Division
  console.log('\n--- Deleting Default Division ---')
  try {
    await prisma.$executeRaw`DELETE FROM divisions WHERE code = 'DEFAULT'`
    console.log('Deleted Default Division')
  } catch (e) {
    console.log('Default Division not found (OK)')
  }

  console.log('\n=== RESET COMPLETE ===')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
