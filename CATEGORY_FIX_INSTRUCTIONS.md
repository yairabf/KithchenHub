# How to Fix "oils", "sweets", "teas" Categories Still Showing

## Problem
Even after updating the mobile `groceryDatabase.ts`, you're still seeing deprecated categories ("oils", "sweets", "teas") in the CategoryPicker dropdown.

## Root Causes
1. ✅ **Mobile mock data** - Fixed in commit `ae09931`
2. ❌ **Backend database** - Still has old categories from seed data  
3. ❌ **Mobile app cache** - Has old categories cached from previous API calls

## Quick Fix (Mobile Only - Fastest)

If you're using **mock data mode** (not connecting to backend):

### Option 1: Clear App Cache
1. In your mobile app, clear the app data/cache
2. Or restart with fresh install

### Option 2: Force Clear Cache in Code
Add this temporary code in `ShoppingListsScreen.tsx` (around line 90):

```typescript
// Load categories for custom item selection
useEffect(() => {
  // TEMPORARY: Clear cache once
  catalogService.clearCache().then(() => {
    catalogService.getShoppingCategories()
      .then((cats) => {
        const mergedCategories = Array.from(
          new Set([...SHOPPING_CATEGORIES, ...cats].map((category) => normalizeCategoryKey(category))),
        );
        setAvailableCategories(mergedCategories);
        // ...rest of code
      });
  });
}, []);
```

Then **remove this code after the cache is cleared once**.

## Complete Fix (Backend + Mobile)

If you're connecting to the backend API, you need to update the database:

### Step 1: Update Seed Data
The backend seeds from `sandbox/final_zero_risk_db.json`. You need to:

1. Update all occurrences in that JSON file:
   - `"Teas"` → `"Beverages"`
   - `"Oils"` → `"Condiments"`
   - `"Sweets"` → `"Bakery"` or `"Snacks"`

### Step 2: Re-seed the Database

```bash
cd backend
npm run db:seed
```

### Step 3: Clear Mobile Cache

Either:
- Reinstall the mobile app
- Or use Option 2 above to force clear cache

---

## Verification

After applying the fix, the CategoryPicker should only show these 19 categories:

```
fruits, vegetables, dairy, meat, seafood, bakery, grains, snacks, 
nuts, beverages, baking, canned, spreads, freezer, dips, condiments, 
spices, household, other
```

No more "oils", "sweets", or "teas"! ✅
