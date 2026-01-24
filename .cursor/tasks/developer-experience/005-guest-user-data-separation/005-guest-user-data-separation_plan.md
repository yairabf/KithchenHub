# 005 - Guest User Data Separation

**Epic:** Developer Experience
**Created:** 2026-01-23
**Status:** Planning

## Overview

Fix the data access pattern to properly separate guest user behavior from signed-in users. Currently, shopping and chores features incorrectly attempt API calls for guest users, leading to errors. The goal is to ensure:
- **Guest users**: Use local/mock data for private data (lists, chores, recipes), but can query public catalogs (groceries, ingredients)
- **Signed-in users**: Use cloud sync for all data, including household features

## Problem Statement

### Current Issues

1. **Shopping Lists** (`ShoppingListsScreen.tsx`):
   - Only checks `config.mockData.enabled`
   - In production, guests try to use `RemoteShoppingService` → API calls fail
   - Missing guest user check

2. **Chores** (`ChoresScreen.tsx`):
   - Only checks `config.mockData.enabled`
   - In production, guests try to use `RemoteChoresService` → API calls fail
   - Missing guest user check

3. **Inconsistent Pattern**:
   - Recipes correctly checks `!user || user.isGuest` ✅
   - Shopping and chores only check `config.mockData.enabled` ❌

## Architecture

### Data Classification

**Public Data** (accessible to everyone via API):
- Grocery catalog search (`/groceries/search`)
- Grocery categories (`/groceries/categories`)
- Ingredient database

**Private Data** (local for guests, cloud for signed-in):
- Shopping lists
- Shopping items
- Recipes
- Chores
- Settings

### Service Selection Pattern

```typescript
// Pattern for PRIVATE data (recipes, shopping lists, chores)
const { user } = useAuth();
const shouldUseMockData = config.mockData.enabled || !user || user.isGuest;
const service = createService(shouldUseMockData);

// Pattern for PUBLIC catalog data (groceries)
// Always use API with fallback to mock on error
try {
  const data = await api.get('/groceries/search');
} catch (error) {
  // Fallback to local mock if API fails
  const data = mockGroceriesDB;
}
```

## Implementation Steps

### 1. Update Shopping Lists Screen
**File**: `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`

**Changes**:
- Import `useAuth` hook
- Add `user` from auth context
- Change service selection logic to include guest check
- Add proper TypeScript types

**Code changes**:
```typescript
// Add import
import { useAuth } from '../../../contexts/AuthContext';

// In component
const { user } = useAuth(); // ADD THIS
const isMockDataEnabled = config.mockData.enabled;
const shouldUseMockData = isMockDataEnabled || !user || user.isGuest; // CHANGE THIS
const shoppingService = useMemo(
  () => createShoppingService(shouldUseMockData), // CHANGE THIS
  [shouldUseMockData] // CHANGE THIS
);
```

### 2. Update Chores Screen
**File**: `mobile/src/features/chores/screens/ChoresScreen.tsx`

**Changes**:
- Import `useAuth` hook
- Add `user` from auth context
- Change service selection logic to include guest check

**Code changes**:
```typescript
// Add import
import { useAuth } from '../../../contexts/AuthContext';

// In component
const { user } = useAuth(); // ADD THIS
const isMockDataEnabled = config.mockData.enabled;
const shouldUseMockData = isMockDataEnabled || !user || user.isGuest; // CHANGE THIS
const choresService = useMemo(
  () => createChoresService(shouldUseMockData), // CHANGE THIS
  [shouldUseMockData] // CHANGE THIS
);
```

### 3. Update Chores Quick Action Modal
**File**: `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx`

**Current Issue**: Uses `config.mockData.enabled` directly

**Changes**:
- Import `useAuth` hook
- Add guest user check for template loading
- Ensure consistency with ChoresScreen

**Code changes**:
```typescript
// Add import
import { useAuth } from '../../../../contexts/AuthContext';

// In component
const { user } = useAuth(); // ADD THIS
const isMockDataEnabled = config.mockData.enabled;
const shouldUseMockData = isMockDataEnabled || !user || user.isGuest; // CHANGE THIS

// Update template loading
useEffect(() => {
  if (shouldUseMockData) { // CHANGE THIS
    setChoreTemplates(mockChoresDB);
  } else {
    // Load from API or service
  }
}, [shouldUseMockData]); // CHANGE THIS
```

### 4. Verify Recipes Implementation (Reference)
**File**: `mobile/src/features/recipes/hooks/useRecipes.ts`

**Status**: ✅ Already correct - serves as reference pattern

**Current implementation**:
```typescript
const { user } = useAuth();
const isMockDataEnabled = config.mockData.enabled;
const shouldUseMockData = isMockDataEnabled || !user || user.isGuest;
const service = createRecipeService(shouldUseMockData);
```

### 5. Verify Grocery Catalog Access (Public Data)
**File**: `mobile/src/features/recipes/screens/RecipesScreen.tsx`

**Status**: ✅ Correctly uses API with error fallback

**Current implementation**:
```typescript
if (isMockDataEnabled) {
  setGroceryItems(mockGroceriesDB);
} else {
  try {
    const results = await api.get('/groceries/search?q=');
    setGroceryItems(results.map(mapGroceryItem));
  } catch (error) {
    console.error('Failed to load grocery items:', error);
    setGroceryItems([]); // Could fallback to mockGroceriesDB
  }
}
```

**Optional Enhancement**: Add fallback to `mockGroceriesDB` on error for offline support.

### 6. Update Documentation
**Files**: 
- `docs/features/shopping.md`
- `docs/features/chores.md`

**Changes**:
- Update service layer sections to reflect guest user logic
- Document the hybrid approach (public catalog via API, private data local for guests)

## Testing Strategy

### Unit Tests
1. **Shopping Service Selection**:
   - Test `config.mockData.enabled = true` → LocalShoppingService
   - Test `config.mockData.enabled = false` + no user → LocalShoppingService
   - Test `config.mockData.enabled = false` + guest user → LocalShoppingService
   - Test `config.mockData.enabled = false` + signed-in user → RemoteShoppingService

2. **Chores Service Selection**:
   - Same test cases as shopping

### Integration Tests
1. **Guest User Flow**:
   - Create shopping list as guest → saves locally
   - Add items to list as guest → saves locally
   - Create chore as guest → saves locally
   - Search groceries as guest → queries API (with mock fallback)

2. **Signed-in User Flow**:
   - Create shopping list as signed-in user → saves to cloud
   - Add items to list as signed-in user → saves to cloud
   - Create chore as signed-in user → saves to cloud
   - Search groceries as signed-in user → queries API

3. **Guest-to-Signed Transition**:
   - Create data as guest → sign in → data imports to household

### Manual Testing Steps
1. Start app in production mode (`config.mockData.enabled = false`)
2. Use app as guest:
   - ✅ Create shopping list → should work (local)
   - ✅ Add items → should work (local)
   - ✅ Search groceries → should work (API)
   - ✅ Create chore → should work (local)
3. Sign in with Google:
   - ✅ Previous guest data should be importable
   - ✅ New data should sync to cloud
4. Test offline:
   - ✅ Grocery search should fallback to mock
   - ✅ Shopping/chores should continue working with local data

## Success Criteria

- [ ] Shopping lists use local data for guests in production
- [ ] Chores use local data for guests in production
- [ ] Recipes continue to work correctly (already implemented)
- [ ] Grocery catalog search works for all users (guest and signed-in)
- [ ] No API errors for guest users in production
- [ ] Service selection logic is consistent across all features
- [ ] Tests pass for all user scenarios
- [ ] Documentation updated to reflect new behavior

## Files to Modify

1. `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
2. `mobile/src/features/chores/screens/ChoresScreen.tsx`
3. `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx`
4. `docs/features/shopping.md`
5. `docs/features/chores.md`

## Potential Risks

1. **Breaking Changes**: Users currently signed in might see different behavior
   - Mitigation: Test thoroughly with both guest and signed-in users

2. **Test Failures**: Existing tests might expect old behavior
   - Mitigation: Update tests to match new guest user logic

3. **Import Flow**: Guest data import might need adjustment
   - Mitigation: Verify import service handles guest data correctly

## Notes

- The `config.mockData.enabled` flag should only be used for **development/testing**, not for determining production guest behavior
- Guest users should always use local data in production, regardless of `config.mockData.enabled`
- Public catalog data (groceries) should always attempt API first, with mock fallback
- Signed-in users should always use cloud sync, regardless of `config.mockData.enabled`
