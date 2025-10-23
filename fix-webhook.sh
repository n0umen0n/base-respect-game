#!/bin/bash

# Alchemy Webhook Fix Script
# This script helps diagnose and fix webhook issues

set -e

echo "🔧 Alchemy Webhook Diagnostic & Fix"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Vercel CLI is installed
echo "📦 Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install it: npm i -g vercel"
    exit 1
fi
echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Step 2: Check environment variables
echo "🔑 Checking environment variables..."
ENV_CHECK=$(vercel env ls 2>&1)

if echo "$ENV_CHECK" | grep -q "ALCHEMY_WEBHOOK_SIGNING_KEY"; then
    echo -e "${GREEN}✅ ALCHEMY_WEBHOOK_SIGNING_KEY is set${NC}"
else
    echo -e "${RED}❌ ALCHEMY_WEBHOOK_SIGNING_KEY is missing!${NC}"
    echo "Add it with: vercel env add ALCHEMY_WEBHOOK_SIGNING_KEY"
    exit 1
fi

if echo "$ENV_CHECK" | grep -q "SUPABASE_URL"; then
    echo -e "${GREEN}✅ SUPABASE_URL is set${NC}"
else
    echo -e "${RED}❌ SUPABASE_URL is missing!${NC}"
    exit 1
fi

if echo "$ENV_CHECK" | grep -q "SUPABASE_SERVICE_KEY"; then
    echo -e "${GREEN}✅ SUPABASE_SERVICE_KEY is set${NC}"
else
    echo -e "${RED}❌ SUPABASE_SERVICE_KEY is missing!${NC}"
    exit 1
fi
echo ""

# Step 3: Check if webhook files exist
echo "📁 Checking webhook files..."
if [ -f "api/webhook-respect-game.ts" ]; then
    echo -e "${GREEN}✅ webhook-respect-game.ts exists${NC}"
else
    echo -e "${RED}❌ webhook-respect-game.ts not found!${NC}"
    exit 1
fi

if [ -f "api/test-webhook.ts" ]; then
    echo -e "${GREEN}✅ test-webhook.ts exists${NC}"
else
    echo -e "${YELLOW}⚠️  test-webhook.ts not found (optional)${NC}"
fi
echo ""

# Step 4: Check vercel.json
echo "⚙️  Checking vercel.json..."
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅ vercel.json exists${NC}"
    cat vercel.json
else
    echo -e "${YELLOW}⚠️  vercel.json not found${NC}"
fi
echo ""

# Step 5: Build and deploy
echo "🚀 Deploying to Vercel..."
echo -e "${YELLOW}This will deploy your changes to production.${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
else
    echo "Deployment cancelled."
    exit 0
fi
echo ""

# Step 6: Test endpoint
echo "🧪 Testing webhook endpoint..."
DOMAIN=$(vercel ls --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"//;s/"//')

if [ -z "$DOMAIN" ]; then
    echo -e "${YELLOW}⚠️  Could not auto-detect domain${NC}"
    read -p "Enter your Vercel domain (e.g., your-app.vercel.app): " DOMAIN
fi

echo "Testing: https://$DOMAIN/api/test-webhook"
RESPONSE=$(curl -s -X POST "https://$DOMAIN/api/test-webhook" \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}')

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test endpoint is working!${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${RED}❌ Test endpoint failed${NC}"
    echo "Response: $RESPONSE"
fi
echo ""

# Step 7: Instructions for Alchemy
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Go to Alchemy Dashboard:"
echo "   https://dashboard.alchemy.com"
echo ""
echo "2. Select your app → Notify → Webhooks"
echo ""
echo "3. Edit your webhook (or create a new one):"
echo "   - Webhook URL: https://$DOMAIN/api/webhook-respect-game"
echo "   - Type: GraphQL"
echo "   - Signing Key: (copy from Alchemy)"
echo ""
echo "4. GraphQL Query (use your contract addresses):"
echo '   {'
echo '     block {'
echo '       logs(filter: {addresses: ["0x8a8dbE61A0368855a455eeC806bCFC40C9e95c29", "0x354d6b039f6d463b706a63f18227eb34d4fc93aA"]}) {'
echo '         account { address }'
echo '         topics'
echo '         data'
echo '         transaction { hash }'
echo '         transactionHash'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "5. Test the webhook in Alchemy dashboard"
echo ""
echo "6. Check logs:"
echo "   vercel logs https://$DOMAIN --follow"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"

