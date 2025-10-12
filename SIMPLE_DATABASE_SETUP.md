# 🚀 Simplified Database Setup - Quick Test

This is the simplified version with just one table and one view for testing!

## 📋 What You're Building

```
User Sets Number
      ↓
Base Blockchain emits event
      ↓
Alchemy Webhook fires
      ↓
Vercel Function updates users table
      ↓
Frontend displays top profiles
```

---

## ✅ 5-Minute Setup

### Step 1: Create Supabase Project (2 min)

1. Go to [https://supabase.com](https://supabase.com)
2. Create new project: `vladrespect-test`
3. Wait for it to initialize

### Step 2: Run Simple Schema (1 min)

1. In Supabase → **SQL Editor**
2. Click **"New Query"**
3. Copy contents of `supabase/schema-simple.sql`
4. Paste and click **"Run"**
5. ✅ Done! You now have:
   - `users` table
   - `top_profiles` view

### Step 3: Get Credentials (1 min)

In Supabase → **Settings** → **API**:

- Copy **Project URL**
- Copy **anon public** key
- Copy **service_role** key

### Step 4: Create `.env.local` (1 min)

```bash
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
VITE_PIMLICO_API_KEY=pim_QLArWNZ7mLYArXrcmBFY5i
```

---

## 🧪 Test Locally (Before Webhook)

### Option 1: Add Test Data via SQL

In Supabase SQL Editor:

```sql
INSERT INTO users (wallet_address, username, current_number, total_transactions, highest_number) VALUES
  ('0x1234567890123456789012345678901234567890', 'Alice', 1000, 15, 1000),
  ('0x2234567890123456789012345678901234567890', 'Bob', 950, 12, 980),
  ('0x3234567890123456789012345678901234567890', 'Charlie', 800, 8, 850)
ON CONFLICT (wallet_address) DO NOTHING;
```

### Option 2: Test with Frontend Component

Add to your `HomePage.jsx`:

```jsx
import SimpleLeaderboard from "./components/SimpleLeaderboard";

<SimpleLeaderboard />;
```

Run your app:

```bash
npm run dev
```

You should see the test profiles! 🎉

---

## 🚀 Deploy Webhook (For Real Transactions)

### Step 1: Rename Webhook File

```bash
# In your project
mv api/webhook-simple.ts api/webhook.ts
```

Or just use `webhook-simple.ts` as your webhook endpoint.

### Step 2: Deploy to Vercel

```bash
vercel
```

### Step 3: Set Environment Variables in Vercel

Dashboard → Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `ALCHEMY_WEBHOOK_SIGNING_KEY`

### Step 4: Create Alchemy Webhook

In Alchemy Dashboard:

- **Type**: Address Activity
- **Network**: Base Mainnet
- **Address**: `0x44aC2daE725b989Df123243A21C9b52b224B4273`
- **Webhook URL**: `https://your-app.vercel.app/api/webhook`
- **Events**: ✅ Event Logs

Get the signing key and add to Vercel env vars.

---

## 🎯 How It Works

### Database Structure

**Users Table:**

```
┌─────────────────┬───────────────┬──────────────┐
│ wallet_address  │ current_number│ total_txs    │
├─────────────────┼───────────────┼──────────────┤
│ 0x123...        │ 1000          │ 15           │
│ 0x456...        │ 950           │ 12           │
│ 0x789...        │ 800           │ 8            │
└─────────────────┴───────────────┴──────────────┘
```

**Top Profiles View:**

- Selects from `users` table
- Orders by `current_number DESC`
- Adds `rank` column
- Limits to 100 rows

### When Transaction Happens

```javascript
// Webhook receives: { newNumber: 333, setter: "0x123..." }

// Updates users table:
await supabase.from("users").upsert({
  wallet_address: "0x123...",
  current_number: 333,
  total_transactions: existingCount + 1,
  highest_number: Math.max(existing, 333),
});

// View automatically updates! (It's just a query)
```

---

## 📊 What You Can Display

### Top Profiles

```tsx
import { getTopProfiles } from "./lib/api-simple";

const profiles = await getTopProfiles(10);
// Returns top 10 profiles with rank
```

### Single User

```tsx
import { getUserByAddress } from "./lib/api-simple";

const user = await getUserByAddress("0x123...");
console.log(user.current_number); // 333
```

### Realtime Updates

```tsx
import { subscribeToUsers } from "./lib/api-simple";

useEffect(() => {
  const unsub = subscribeToUsers((payload) => {
    console.log("User updated!", payload);
    // Refetch data
  });
  return () => unsub();
}, []);
```

---

## 🧪 Testing Checklist

### 1. Test Database Directly

```sql
-- In Supabase SQL Editor
SELECT * FROM users ORDER BY current_number DESC;
SELECT * FROM top_profiles;
```

### 2. Test Frontend

- Run `npm run dev`
- Add `<SimpleLeaderboard />` component
- Should see profiles (if you added test data)

### 3. Test Webhook Locally

```bash
# Send test POST to your local endpoint
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 4. Test Full Pipeline

- Send real transaction in your UI
- Check Alchemy webhook deliveries
- Check Supabase users table
- Check frontend updates

---

## 🔍 Debugging

### Frontend not showing data?

```javascript
// Check browser console
import { getTopProfiles } from "./lib/api-simple";

getTopProfiles().then(console.log).catch(console.error);
```

### Webhook not updating database?

```bash
# Check Vercel logs
vercel logs --follow

# Check Alchemy webhook deliveries
# Dashboard → Your Webhook → Recent Deliveries
```

### Database query errors?

```sql
-- Check if table exists
SELECT * FROM users LIMIT 5;

-- Check if view exists
SELECT * FROM top_profiles LIMIT 5;
```

---

## 📁 Files for Simple Setup

### Use These Files:

- ✅ `supabase/schema-simple.sql` - Simplified schema
- ✅ `api/webhook-simple.ts` - Simplified webhook
- ✅ `src/lib/api-simple.ts` - Simplified API utilities
- ✅ `src/components/SimpleLeaderboard.tsx` - Simple component

### Don't Use These (Yet):

- ❌ `supabase/schema.sql` - Full complex schema
- ❌ `api/webhook.ts` - Complex webhook with triggers
- ❌ `src/lib/api.ts` - Full API with all tables

---

## 🎓 What This Tests

This simplified setup lets you test:

- ✅ Supabase connection
- ✅ Database queries
- ✅ Views
- ✅ Webhook → Database flow
- ✅ Frontend → Database flow
- ✅ Realtime subscriptions

Once this works, you can graduate to the full schema!

---

## 🎉 Success Criteria

You'll know it works when:

1. ✅ Can query `users` table in Supabase
2. ✅ Can query `top_profiles` view
3. ✅ Frontend component displays profiles
4. ✅ Send transaction → Webhook fires
5. ✅ Database updates
6. ✅ Frontend shows updated data

---

## 📈 Next Steps

Once the simple version works:

1. **Add more test data** manually
2. **Test realtime updates** (send multiple transactions)
3. **Add user profile editing** (username, avatar, bio)
4. **Graduate to full schema** (`schema.sql`) when ready

---

**Quick tip**: Test with manual SQL inserts first, then add webhook, then test full pipeline. One step at a time! 🚀
