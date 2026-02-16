# Fix: Custom Category Images Not Showing

**Date**: February 16, 2026  
**Issue**: Custom categories don't display images  
**Status**: ✅ Fixed

---

## Problem

When creating a **custom category** (not one of the predefined categories like "fruits", "vegetables", etc.), the category tile would not show any image, even when the items in that category had valid image URLs.

### Root Cause

In `catalogUtils.ts`, the `buildCategoriesFromGroceries()` function was always setting `image: ''` for all categories:

```typescript
image: '', // Empty - CategoriesGrid will use icon assets based on categoryId
```

This worked fine for predefined categories because:
- `CategoriesGrid` has local PNG assets in `/assets/categories/`
- `getCategoryIcon()` loads these based on `categoryId`

But for **custom categories**:
- No local PNG asset exists
- `category.image` is empty
- Result: **No image displays** ❌

---

## Solution

Modified `buildCategoriesFromGroceries()` to use the first item's image from each category:

```typescript
// Use first item's image as category image (for custom categories without local icons)
// CategoriesGrid will prioritize local icon assets, then fall back to this image URL
const firstItemWithImage = categoryItems.find(item => item.image && item.image.trim() !== '');
const categoryImage = firstItemWithImage?.image || '';

return {
  id: categoryId,
  localId,
  name: displayName,
  itemCount: categoryItems.length,
  image: categoryImage, // ✅ Now uses first item's image
  backgroundColor: pastelColors[index % pastelColors.length],
};
```

---

## How It Works Now

The `CategoriesGridItem` component has a priority system:

### 1. **Predefined Categories** (Priority: Highest)
```
hasIcon = true → Shows local PNG asset
Example: "Fruits" → /assets/categories/fruits.png
```

### 2. **Custom Categories with Images** (Priority: Medium)
```
hasIcon = false, hasImage = true → Shows category.image URL
Example: "Pet Food" → Uses first pet food item's image
```

### 3. **Custom Categories without Images** (Priority: Lowest)
```
hasIcon = false, hasImage = false → Shows category name only
Example: "Miscellaneous" with no item images
```

---

## Files Changed

### Modified (2)
1. **`mobile/src/common/utils/catalogUtils.ts`**
   - Updated `buildCategoriesFromGroceries()` to populate `image` field
   - Now uses first item's image URL for custom categories

2. **`mobile/src/common/utils/__tests__/catalogUtils.spec.ts`**
   - Updated tests to reflect new behavior
   - Added test cases for image handling

---

## Test Results

```bash
✅ All 32 tests passing
✅ Image handling validated
✅ Edge cases covered (empty, whitespace, valid URLs)
```

### Test Coverage

```typescript
✓ should use first item image as category image (for custom categories)
✓ should use empty string if no items have valid images
✓ should handle empty string correctly
✓ should handle whitespace only correctly
✓ should handle valid image correctly
```

---

## Benefits

1. **Custom categories now show images** ✅
2. **Predefined categories unchanged** (still use local assets)
3. **Fallback behavior graceful** (empty string if no images)
4. **No breaking changes** to existing functionality

---

## Example

### Before Fix:
```
Custom Category: "Pet Food"
Items: [
  { name: "Dog Food", image: "https://example.com/dog-food.jpg" },
  { name: "Cat Food", image: "https://example.com/cat-food.jpg" }
]
Category tile: [No image shown] ❌
```

### After Fix:
```
Custom Category: "Pet Food"
Items: [
  { name: "Dog Food", image: "https://example.com/dog-food.jpg" },
  { name: "Cat Food", image: "https://example.com/cat-food.jpg" }
]
Category tile: [Shows dog-food.jpg] ✅
```

---

**Status**: ✅ Ready for commit  
**Tests**: ✅ 32/32 passing
