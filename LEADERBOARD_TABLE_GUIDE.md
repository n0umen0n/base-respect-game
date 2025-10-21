# Leaderboard Table Implementation Guide

## ✅ What's Been Built

I've implemented a complete leaderboard table system for your homepage with an **8-bit retro aesthetic**. The table displays all members below the top 6 featured cards.

## 🎨 Features

### Visual Design

- **8-bit Style**: Press Start 2P font throughout
- **Bold Black Header**: Black background with white text
- **Bordered Cells**: Grid-style borders between cells for that retro look
- **Pixelated Avatars**: Profile pictures with `imageRendering: pixelated`
- **Starts from Rank 7**: Top 6 members are shown in featured cards above
- **Consistent Score Display**: Uses same `formatRespectDisplay()` function as profile cards
- **Wide Layout**: 1200px max width for comfortable viewing
- **Left-aligned Names**: Profile pictures and names aligned to the left for better readability
- **Integrated Search**: Search box positioned directly above table with minimal spacing
- **Hover Effects**: Rows scale and highlight on hover
- **Alternating Rows**: Striped background for better readability

### Functionality

- **Search Members**: Real-time search by member name with 8-bit styled search box
- **Complete Leaderboard**: Shows members from rank 7 onwards (top 6 displayed as cards above)
- **Real Rankings**: Automatically ranks by average_respect score
- **Clickable Rows**: Click any member to visit their profile
- **Twitter Integration**: Shows verified status (✅) or missing (❌)
- **Clickable Twitter Links**: Links open in new tab, with click stopping propagation
- **Loading State**: Spinner while fetching data
- **Empty States**: Different messages for no members vs no search results
- **Avatar Display**: 48x48px avatars with black border and shadow
- **Score Formatting**: Uses `formatRespectDisplay()` for consistent display across the app

## 📁 Files Modified

### 1. `/src/lib/supabase-respect.ts`

Added new function:

```typescript
export async function getAllMembers(): Promise<TopSixMember[]>;
```

Fetches all approved members, ordered by respect score, with rank calculated.

### 2. `/src/components/HomePage.jsx`

- Imports `getAllMembers` and `formatRespectDisplay` functions
- Added `allMembers` and `searchQuery` state
- Fetches both top 6 and all members simultaneously
- Table shows members from rank 7 onwards using filtered results
- Search filter: `filteredMembers` filters by name (case-insensitive)
- Uses `formatRespectDisplay()` for consistent score formatting
- Enhanced table styling with 8-bit aesthetic
- Search box styled with Press Start 2P font and black borders

## 🚀 How to Use

### Step 1: Populate Test Data

Run this in your Supabase SQL Editor:

```bash
supabase/populate-test-leaderboard.sql
```

This creates 50 test members with:

- Varied respect scores (0-87)
- Mix of Twitter accounts (verified/unverified/missing)
- Different profile pictures
- Realistic join dates

### Step 2: View the Leaderboard

1. Start your dev server: `npm run dev`
2. Visit `localhost:5173`
3. Scroll down past the top 6 cards
4. See the full leaderboard table!

### Step 3: Use the Search

Type in the search box above the table to filter members by name:

- Search is case-insensitive
- Results update in real-time as you type
- Shows "No members found matching your search" when no matches

### Step 4: Clean Up (Optional)

When you're done testing, delete test data:

```bash
supabase/delete-test-leaderboard.sql
```

## 🔍 Search Feature

The search functionality:

- **Live filtering**: Updates results as you type
- **Case-insensitive**: Finds "john", "John", "JOHN", etc.
- **Name matching**: Searches only member names
- **8-bit styled**: Matches the retro aesthetic with Press Start 2P font
- **Visual feedback**: Hover and focus states for better UX
- **Empty state**: Shows helpful message when no results found

## 🎮 Table Structure

| Column            | Description           | Style                                                   |
| ----------------- | --------------------- | ------------------------------------------------------- |
| **Rank**          | Position (7, 8, 9...) | Black text, centered, starts from rank 7                |
| **Name**          | Member name + avatar  | 48x48 avatar, left-aligned, name with ellipsis overflow |
| **X**             | Twitter handle        | Blue links, centered, ✅ verified, ❌ missing           |
| **Respect Score** | Average respect       | Centered, formatted using formatRespectDisplay()        |

## 🎯 Performance Notes

The table:

- Fetches data once on mount
- Uses React keys for efficient rendering
- Loads both queries in parallel (Promise.all)
- No pagination yet (shows all members)

If you have 1000+ members, consider adding:

- Virtual scrolling
- Pagination
- "Load more" button
- Search/filter functionality

## 🔧 Customization

### Change Number of Featured Cards

Currently shows top 6. To change:

1. Update the view in SQL: `top_six_members` → `top_ten_members`
2. Or keep top_six_members and use getAllMembers() for cards too

### Add Pagination

```javascript
const [page, setPage] = useState(0);
const rowsPerPage = 50;
const paginatedMembers = allMembers.slice(
  page * rowsPerPage,
  (page + 1) * rowsPerPage
);
```

### Change Table Styling

Look for these in `HomePage.jsx`:

- Table width: `maxWidth: '1200px'`
- Header background: `backgroundColor: '#000'`
- Border color: `border: '4px solid #000'`
- Hover color: `backgroundColor: '#f0f0f0'`
- Cell borders: `borderRight: '2px solid #e0e0e0'`
- Name column padding: `paddingLeft: '3rem'`

### Customize Search

Modify the search functionality:

**Search by different fields:**

```javascript
// Search by name and Twitter handle
const filteredMembers = allMembers
  .slice(6)
  .filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.x_account &&
        member.x_account.toLowerCase().includes(searchQuery.toLowerCase()))
  );
```

**Change search box styling:**

- Font size: `fontSize: '0.75rem'`
- Border: `border: '4px solid #000'`
- Background: `backgroundColor: '#ffffff'`
- Placeholder: `placeholder="Search members by name..."`
- Spacing: `margin: '4rem auto 0.75rem'` (4rem top space from cards, 0.75rem bottom to table)

## 📊 Database Structure

The leaderboard pulls from the `members` table:

```sql
SELECT
  wallet_address,
  name,
  profile_url,
  x_account,
  x_verified,
  average_respect,
  total_respect_earned
FROM members
WHERE is_approved = true
  AND is_banned = false
ORDER BY
  average_respect DESC,
  total_respect_earned DESC
```

## 🎉 That's It!

Your leaderboard table is now live and ready to display all your community members with style! The 8-bit aesthetic matches your existing design perfectly.

Enjoy! 🏆
