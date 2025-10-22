#!/bin/bash

# Security Fix Application Script
# This script helps you apply the database security fixes

echo "🔒 Vladrespect Security Fix Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "This script will help you secure your Supabase database."
echo ""
echo "📋 Checklist:"
echo "  1. Apply RLS policies to Supabase"
echo "  2. Verify environment variables"
echo "  3. Test security"
echo ""

# Step 1: Database
echo "${YELLOW}Step 1: Apply Database Security Policies${NC}"
echo "-------------------------------------------"
echo ""
echo "⚠️  You need to apply the secure RLS policies to your Supabase database."
echo ""
echo "Instructions:"
echo "  1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to SQL Editor"
echo "  4. Copy and paste the contents of: supabase/secure-rls-fix-respect-game.sql"
echo "  5. Click 'Run'"
echo ""
read -p "Have you applied the SQL policies? (y/n): " applied_sql

if [ "$applied_sql" != "y" ]; then
  echo "${RED}❌ Please apply the SQL policies first!${NC}"
  echo ""
  echo "Copy this file to Supabase SQL Editor:"
  echo "  ${PWD}/supabase/secure-rls-fix-respect-game.sql"
  echo ""
  exit 1
fi

echo "${GREEN}✅ SQL policies applied${NC}"
echo ""

# Step 2: Environment Variables
echo "${YELLOW}Step 2: Verify Environment Variables${NC}"
echo "---------------------------------------"
echo ""
echo "Required environment variables:"
echo ""
echo "Backend (Vercel):"
echo "  SUPABASE_URL"
echo "  SUPABASE_SERVICE_KEY  ⚠️  (service_role key - keep secret!)"
echo "  ALCHEMY_WEBHOOK_SIGNING_KEY"
echo ""
echo "Frontend (.env.local):"
echo "  VITE_SUPABASE_URL"
echo "  VITE_SUPABASE_ANON_KEY  (now read-only)"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo "✅ Found .env.local"
  
  # Check for required frontend variables
  if grep -q "VITE_SUPABASE_URL" .env.local && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    echo "${GREEN}✅ Frontend environment variables found${NC}"
  else
    echo "${RED}⚠️  Missing frontend environment variables in .env.local${NC}"
  fi
else
  echo "${RED}⚠️  .env.local not found${NC}"
  echo "Create it with:"
  echo "  VITE_SUPABASE_URL=https://xxx.supabase.co"
  echo "  VITE_SUPABASE_ANON_KEY=eyJhbG..."
fi

echo ""
read -p "Are all environment variables set in Vercel? (y/n): " vercel_env

if [ "$vercel_env" != "y" ]; then
  echo "${YELLOW}⚠️  Set environment variables in Vercel:${NC}"
  echo "  https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
  echo ""
fi

# Step 3: Test Security
echo ""
echo "${YELLOW}Step 3: Test Security${NC}"
echo "----------------------"
echo ""
echo "After deploying, test that security is working:"
echo ""
echo "Test 1: Verify frontend cannot write to database"
echo "  - Open browser console on your site"
echo "  - Run: const { error } = await supabase.from('members').update({name:'test'}).eq('wallet_address','0x...')"
echo "  - Expected: Permission denied error"
echo ""
echo "Test 2: Verify signature is required"
echo "  - Try calling /api/update-profile without signature"
echo "  - Expected: 401 Unauthorized"
echo ""
echo "Test 3: Test legitimate update"
echo "  - Go to your profile"
echo "  - Link Twitter/X account"
echo "  - Check console for successful signature and update"
echo ""

# Summary
echo ""
echo "${GREEN}=================================="
echo "🎉 Security Fix Setup Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy to Vercel (git push)"
echo "  2. Test security (see tests above)"
echo "  3. Review: SECURITY_FIX_GUIDE.md"
echo ""
echo "Your database is now secure! 🔒"
echo ""
echo "Files created/modified:"
echo "  ✅ supabase/secure-rls-fix-respect-game.sql (new - run this!)"
echo "  ✅ api/update-profile.ts (new)"
echo "  ✅ src/lib/secure-api.ts (new)"
echo "  ✅ src/components/ProfilePage.tsx (updated)"
echo "  ✅ src/lib/supabase-respect.ts (deprecated vulnerable function)"
echo "  ✅ SECURITY_FIX_GUIDE.md (new)"
echo ""

