#!/bin/bash
# ────────────────────────────────────────────────────────
# RMA Finance WhatsApp Bot - Vercel Deployment Script
# ────────────────────────────────────────────────────────
# This script prepares the project for Vercel deployment
# by switching from SQLite to PostgreSQL schema.
# ────────────────────────────────────────────────────────

set -e

echo "🚀 Preparing RMA Finance WhatsApp Bot for Vercel deployment..."
echo ""

# Step 1: Switch Prisma schema to PostgreSQL
echo "📦 Step 1: Switching Prisma schema to PostgreSQL..."
cp prisma/schema.postgresql.prisma prisma/schema.prisma
echo "   ✅ PostgreSQL schema activated"

# Step 2: Generate Prisma client
echo "📦 Step 2: Generating Prisma client..."
npx prisma generate
echo "   ✅ Prisma client generated"

# Step 3: Build Next.js
echo "📦 Step 3: Building Next.js application..."
npx next build
echo "   ✅ Build complete"

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set DATABASE_URL in Vercel (PostgreSQL connection string)"
echo "   2. Set NEXT_PUBLIC_APP_URL in Vercel (your app URL)"
echo "   3. Deploy: npx vercel --prod"
echo "   4. Run migration: npx prisma db push"
echo "   5. Seed data: curl -X POST https://your-app.vercel.app/api/seed"
echo "   6. Configure Maytapi webhook: https://your-app.vercel.app/api/webhook/maytapi"
echo ""
