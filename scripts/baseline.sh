#!/usr/bin/env bash
# Baseline script for existing HRIS databases.
#
# Run this ONCE on an existing database (local staging, production, etc.)
# that already contains the base HRIS schema (tables from the legacy HRIS
# system) but has never been managed by Prisma Migrate.
#
# It marks the `20250101000000_init` migration as already applied without
# running its SQL, so that subsequent `prisma migrate deploy` can pick up
# and apply the newer 2026 migrations on top of the existing schema.
#
# Prerequisite: DATABASE_URL in .env must point at the target database.
#
# Safe to run multiple times: `prisma migrate resolve --applied` is idempotent.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "Baselining database with init migration..."
npx prisma migrate resolve --applied 20250101000000_init

echo ""
echo "Baseline complete. Now run:"
echo "  npx prisma migrate deploy"
echo ""
echo "to apply all subsequent 2026 migrations."
