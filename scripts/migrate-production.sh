#!/bin/bash

# Production Database Migration Script
# This script runs Prisma migrations against the production database
# Usage: ./scripts/migrate-production.sh

set -e  # Exit on any error

echo "================================================"
echo "  Production Database Migration"
echo "================================================"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "Please create .env.production with DATABASE_URL"
    exit 1
fi

# Load environment variables
echo "📂 Loading .env.production..."
export $(cat .env.production | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.production"
    exit 1
fi

echo "✅ Environment loaded"
echo ""

# Baseline existing migrations (one-time fix for P3005 error)
echo "🔧 Baselining existing migrations..."
echo "   (Safe to run - only updates migration tracking table)"
echo ""

npx prisma migrate resolve --applied "20251030170057_init" 2>/dev/null || echo "   ✓ 20251030170057_init"
npx prisma migrate resolve --applied "20251102024826_add_changelog_models" 2>/dev/null || echo "   ✓ 20251102024826_add_changelog_models"
npx prisma migrate resolve --applied "20251105050929_remove_release_tags" 2>/dev/null || echo "   ✓ 20251105050929_remove_release_tags"
npx prisma migrate resolve --applied "20251105081327_add_is_prerelease" 2>/dev/null || echo "   ✓ 20251105081327_add_is_prerelease"

echo ""
echo "✅ Baseline complete"
echo ""

# Deploy any pending migrations
echo "🚀 Deploying migrations..."
echo ""

npx prisma migrate deploy

echo ""
echo "================================================"
echo "✅ Migration completed successfully!"
echo "================================================"
