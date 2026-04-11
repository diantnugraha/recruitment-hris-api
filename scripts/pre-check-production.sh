#!/usr/bin/env bash
# Pre-check script before running Prisma migrations on a new (non-Prisma) database.
#
# Usage:
#   ./scripts/pre-check-production.sh
#
# Reads DATABASE_URL from .env. Override by exporting DATABASE_URL before running:
#   DATABASE_URL="mysql://user:pass@host:3306/db" ./scripts/pre-check-production.sh

set -euo pipefail
cd "$(dirname "$0")/.."

# ─── Load DATABASE_URL ────────────────────────────────────────────────────────
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set. Export it or add it to .env."
  exit 1
fi

# Parse mysql://user:pass@host:port/dbname?params
_url="${DATABASE_URL#mysql://}"
_userpass="${_url%%@*}"
_hostpath="${_url#*@}"
DB_USER="${_userpass%%:*}"
DB_PASS="${_userpass#*:}"
_hostport="${_hostpath%%/*}"
DB_HOST="${_hostport%%:*}"
DB_PORT="${_hostport##*:}"
_dbname="${_hostpath#*/}"
DB_NAME="${_dbname%%\?*}"
[[ "$DB_PORT" == "$DB_HOST" ]] && DB_PORT="3306"

# ─── MySQL helper ─────────────────────────────────────────────────────────────
q() {
  MYSQL_PWD="$DB_PASS" mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --database="$DB_NAME" \
    --skip-column-names \
    --silent \
    -e "$1" 2>/dev/null
}

# ─── Counters ─────────────────────────────────────────────────────────────────
PASS=0
FAIL=0
WARN=0

ok()   { echo "  [PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN+1)); }

col_exists()    { [[ -n "$(q "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$1' AND COLUMN_NAME='$2';")" ]]; }
col_missing()   { ! col_exists "$1" "$2"; }
table_exists()  { [[ -n "$(q "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$1';")" ]]; }
table_missing() { ! table_exists "$1"; }
index_exists()  { [[ -n "$(q "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$1' AND INDEX_NAME='$2';")" ]]; }

# ─── Start ────────────────────────────────────────────────────────────────────
echo ""
echo "==========================================="
echo " Prisma Migration Pre-Check"
echo " Target: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "==========================================="

# Test connection
if ! q "SELECT 1;" &>/dev/null; then
  echo ""
  echo "ERROR: Cannot connect to database. Check DATABASE_URL."
  exit 1
fi
echo " Connection: OK"
echo ""

# ─── 1. Required tables (must exist) ─────────────────────────────────────────
echo "--- [1] Required base tables must exist ---"
for tbl in \
  candidate_recruitment \
  candidate_recruitment_assessment \
  candidate_recruitment_onboarding \
  candidate_recruitment_detail \
  employee_request \
  employee_budget \
  employee_list \
  divisions \
  departments \
  obs \
  job_levels \
  job_titles \
  users \
  facillities \
  onboarding_program \
  department_job_title; do
  if table_exists "$tbl"; then
    ok "Table '$tbl' exists"
  else
    fail "Table '$tbl' is MISSING — migrations will fail"
  fi
done

# ─── 2. New tables must NOT exist yet ─────────────────────────────────────────
echo ""
echo "--- [2] New tables must NOT exist yet ---"
for tbl in \
  candidate_assessment_scoring \
  candidate_assessment_assignee \
  notification \
  facility_pics \
  program_pics; do
  if table_missing "$tbl"; then
    ok "Table '$tbl' does not exist (safe to create)"
  else
    fail "Table '$tbl' ALREADY EXISTS — CREATE TABLE will fail"
  fi
done

# ─── 3. Critical column: reviewed_at rename ───────────────────────────────────
echo ""
echo "--- [3] employee_request column rename (reviewed_at → hr_reviewed_at) ---"
if col_exists "employee_request" "reviewed_at"; then
  ok "Column 'employee_request.reviewed_at' exists (rename will work)"
else
  fail "Column 'employee_request.reviewed_at' is MISSING — CHANGE COLUMN will fail"
fi
if col_missing "employee_request" "hr_reviewed_at"; then
  ok "Column 'employee_request.hr_reviewed_at' does not exist yet (safe)"
else
  fail "Column 'employee_request.hr_reviewed_at' ALREADY EXISTS — rename will conflict"
fi

# ─── 4. ADD COLUMN checks — columns must not exist yet ───────────────────────
echo ""
echo "--- [4] ADD COLUMN checks (must not exist yet) ---"
NEW_COLS=(
  "candidate_recruitment|uniform_shirt_size"
  "candidate_recruitment|uniform_pants_size"
  "candidate_recruitment|domicile_address"
  "candidate_recruitment|agreement_accepted_at"
  "candidate_recruitment|agreement_version"
  "candidate_recruitment_assessment|interview_started_at"
  "candidate_recruitment_assessment|mcu_document_url"
  "candidate_recruitment_assessment|mcu_document_name"
  "candidate_recruitment_assessment|interview_date"
  "candidate_recruitment_assessment|interview_type"
  "candidate_recruitment_assessment|mcu_date"
  "candidate_recruitment_assessment|mcu_location"
  "candidate_recruitment_onboarding|onboarding_accepted_at"
  "candidate_recruitment_onboarding|onboarding_sent_at"
  "candidate_recruitment_onboarding|join_date"
  "candidate_recruitment_detail|invited_by"
  "divisions|obs_id"
  "divisions|is_management"
  "divisions|head_of_division_id"
  "divisions|deputy_head_id"
  "departments|manager_id"
  "obs|code"
  "job_levels|code"
  "employee_list|department_id"
  "employee_list|employee_nationality"
  "employee_budget|document_name"
  "employee_request|department_id"
  "employee_request|hod_reviewed_by"
  "employee_request|hod_reviewed_at"
  "employee_request|hr_reviewed_by"
  "employee_request|approved_by"
  "employee_request|revised_by"
  "employee_request|revised_at"
  "employee_request|rejected_by"
  "employee_request|rejected_at"
  "employee_request|recruitment_started_at"
)

for entry in "${NEW_COLS[@]}"; do
  tbl="${entry%%|*}"
  col="${entry##*|}"
  if col_missing "$tbl" "$col"; then
    ok "Column '$tbl.$col' does not exist (safe to add)"
  else
    fail "Column '$tbl.$col' ALREADY EXISTS — ADD COLUMN will fail"
  fi
done

# ─── 5. Unique constraint: facillities.inventory_no ──────────────────────────
echo ""
echo "--- [5] facillities.inventory_no — check for duplicates before UNIQUE constraint ---"
dup_count=$(q "SELECT COUNT(*) FROM (SELECT inventory_no, COUNT(*) c FROM facillities WHERE inventory_no IS NOT NULL GROUP BY inventory_no HAVING c > 1) t;" 2>/dev/null || echo "0")
if [[ "$dup_count" -eq 0 ]]; then
  ok "No duplicate inventory_no values (UNIQUE constraint safe to add)"
else
  fail "Found $dup_count duplicate inventory_no value(s) — UNIQUE constraint will fail. Fix duplicates first."
fi

# ─── 6. Job level seed names ──────────────────────────────────────────────────
echo ""
echo "--- [6] job_levels seed check (code will be set by name match) ---"
hod=$(q "SELECT COUNT(*) FROM job_levels WHERE name = 'Head of Division';" 2>/dev/null || echo "0")
mgr=$(q "SELECT COUNT(*) FROM job_levels WHERE name = 'Manager';" 2>/dev/null || echo "0")
if [[ "$hod" -gt 0 ]]; then
  ok "job_levels: found 'Head of Division' — seed will apply"
else
  warn "job_levels: 'Head of Division' not found — HEAD_OF_DIVISION code will NOT be seeded (check name in prod)"
fi
if [[ "$mgr" -gt 0 ]]; then
  ok "job_levels: found 'Manager' — seed will apply"
else
  warn "job_levels: 'Manager' not found — MANAGER code will NOT be seeded (check name in prod)"
fi
echo "  All job_levels in production:"
q "SELECT CONCAT('    id=', id, ' name=', name) FROM job_levels ORDER BY id;" 2>/dev/null | while IFS= read -r line; do echo "$line"; done

# ─── 7. job_titles.division_id = 0 backfill ──────────────────────────────────
echo ""
echo "--- [7] job_titles.division_id = 0 backfill check ---"
zero_count=$(q "SELECT COUNT(*) FROM job_titles WHERE division_id = 0;" 2>/dev/null || echo "0")
if [[ "$zero_count" -gt 0 ]]; then
  warn "$zero_count row(s) in job_titles have division_id = 0 — will be set to NULL (expected, safe)"
else
  ok "No job_titles rows with division_id = 0"
fi

# ─── 8. department_job_title backfill for employee_request.department_id ──────
echo ""
echo "--- [8] department_job_title backfill check ---"
if table_exists "department_job_title"; then
  djt_count=$(q "SELECT COUNT(*) FROM department_job_title;" 2>/dev/null || echo "0")
  er_count=$(q "SELECT COUNT(*) FROM employee_request;" 2>/dev/null || echo "0")
  ok "department_job_title has $djt_count rows (employee_request has $er_count rows — backfill will run)"
else
  fail "Table 'department_job_title' not found — backfill UPDATE will silently produce no rows (not fatal, but check)"
fi

# ─── 9. Summary ───────────────────────────────────────────────────────────────
echo ""
echo "==========================================="
echo " RESULT: $PASS passed | $FAIL failed | $WARN warnings"
echo "==========================================="
if [[ "$FAIL" -gt 0 ]]; then
  echo ""
  echo " ACTION REQUIRED: Fix all [FAIL] items before running:"
  echo "   ./scripts/baseline.sh && npx prisma migrate deploy"
  echo ""
  exit 1
else
  echo ""
  if [[ "$WARN" -gt 0 ]]; then
    echo " [WARN] items are non-fatal but review them above."
  fi
  echo " Safe to proceed:"
  echo "   ./scripts/baseline.sh && npx prisma migrate deploy"
  echo ""
  exit 0
fi
