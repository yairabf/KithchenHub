# Plan: Extract Search Bar into Reusable Component

**Date:** 2026-01-14  
**Status:** Planning  
**Priority:** Medium  
**Estimated Effort:** 2-3 hours

---

## 📋 Current Situation

### Existing Implementations

We currently have **two separate** search bar implementations that are nearly identical:

#### 1. **ShoppingQuickActionModal** (`src/components/modals/ShoppingQuickActionModal.tsx`)
- Cream background (`colors.background` - #F5F5F0)
- No shadow
- Dropdown results with images, names, categories
- Quick add button (add-circle icon)
- Searches `mockGroceriesDB`
- Icon size: 20px
- Basic dropdown styling

#### 2. **ShoppingListsScreen** (`src/screens/shopping/ShoppingListsScreen.tsx`)
- White background (`colors.surface` - #FFFFFF)
- Box shadow (`shadows.sm`)
- Dropdown results with images, names, categories
- Quick add button (add-circle icon)
- Searches `mockGroceriesDB`
- Icon size: 18px
- Enhanced dropdown styling with absolute positioning

### Problems with Current Approach

- ❌ **Code duplication** - Same logic in multiple places
- ❌ **Inconsistent styling** - Different backgrounds and shadows
- ❌ **Maintenance burden** - Need to update in multiple files
- ❌ **No reusability** - Can't easily add to other screens

---

## 🎯 Proposed Solution

### Component Name
**`GrocerySearchBar`**

### Location
```
src/components/common/GrocerySearchBar/
├── GrocerySearchBar.tsx    # Main component
├── types.ts                 # TypeScript interfaces
├── styles.ts               # StyleSheet definitions
└── index.ts                # Clean exports
```

---

## 📦 Component Interface

### Props Definition

```typescript
interface GroceryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  defaultQuantity: number;
}

interface GrocerySearchBarProps {
  // Required Props
  items: GroceryItem[];
  onSelectItem: (item: GroceryItem) => void;
  onQuickAddItem: (item: GroceryItem) => void;
  
  // Optional UI Customization
  placeholder?: string;
  variant?: 'surface' | 'background';  // white vs cream background
  showShadow?: boolean;
  maxResults?: number;                 // default: 8
  
  // Optional Controlled State (for advanced use cases)
  value?: string;
  onChangeText?: (text: string) => void;
  
  // Optional Styling Overrides
  containerStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
}
```

### Default Props
- `placeholder`: `"Search groceries to add..."`
- `variant`: `"surface"` (white background)
- `showShadow`: `true`
- `maxResults`: `8`

---

## 🔧 Features to Extract

### 1. Search Input Field
- ✅ Search icon (search-outline, 20px)
- ✅ TextInput with placeholder
- ✅ Clear button (close-circle, 20px) - appears when text exists
- ✅ Auto-focus capability
- ✅ Keyboard handling

### 2. Search Logic
- ✅ Real-time filtering by item name and category
- ✅ Case-insensitive search
- ✅ Limit results to maxResults (default 8)
- ✅ useMemo optimization for performance
- ✅ Show/hide dropdown based on results

### 3. Dropdown Results
- ✅ Absolute positioning relative to search bar
- ✅ ScrollView with nestedScrollEnabled
- ✅ keyboardShouldPersistTaps="handled"
- ✅ Individual result items with:
  - Product image (48x48, rounded)
  - Product name (bold)
  - Category name (muted)
  - Quick add button (add-circle icon, 28px, `colors.primary`)

### 4. Styling
- ✅ Configurable variant (surface/background)
- ✅ Optional shadow for elevation
- ✅ Consistent spacing using theme
- ✅ Max dropdown height: 300px
- ✅ Border radius from theme
- ✅ Proper z-index handling

### 5. Interaction Behavior
- ✅ Click outside to dismiss dropdown
- ✅ Two interaction modes:
  - Click item → opens detail/quantity modal
  - Click add-circle → quick add with default quantity
- ✅ Dropdown stays open after quick add (for bulk adding)
- ✅ Clear button clears text and closes dropdown

---

## 📝 Implementation Steps

### Phase 1: Create Component Structure
**Tasks:**
1. Create folder: `src/components/common/GrocerySearchBar/`
2. Create `types.ts` with interfaces
3. Create `styles.ts` with StyleSheet
4. Create `index.ts` for exports
5. Create main `GrocerySearchBar.tsx`

**Estimated Time:** 30 minutes

---

### Phase 2: Build GrocerySearchBar Component
**Tasks:**
1. Set up component structure and props
2. Implement state management:
   - `searchQuery` (string)
   - `showSearchDropdown` (boolean)
   - `inputRef` (useRef)
3. Implement search filtering logic:
   - useMemo for filtered items
   - Filter by name and category (case-insensitive)
   - Limit to maxResults
4. Build search input UI:
   - Container with TouchableWithoutFeedback
   - Search icon
   - TextInput
   - Conditional clear button
5. Build dropdown UI:
   - Conditional rendering
   - Absolute positioning
   - ScrollView with results
   - Item cards with image, text, and add button
6. Add interaction handlers:
   - onSelectItem handler
   - onQuickAddItem handler
   - Clear handler
   - Outside click handler

**Estimated Time:** 1-1.5 hours

---

### Phase 3: Refactor ShoppingQuickActionModal
**Tasks:**
1. Import GrocerySearchBar component
2. Remove local state:
   - `searchQuery`
   - `showSearchDropdown`
   - `inputRef`
3. Remove search logic and useMemo
4. Replace search bar JSX with `<GrocerySearchBar />`
5. Pass required props:
   - `items={mockGroceriesDB}`
   - `onSelectItem={handleSelectGroceryItem}`
   - `onQuickAddItem={handleQuickAddItem}`
   - `variant="background"` (to match current cream style)
6. Remove unused styles:
   - `searchContainer`
   - `searchBar`
   - `searchInput`
   - `searchDropdown`
   - `searchDropdownScroll`
   - `searchResultItem`
   - `searchResultContent`
   - `searchResultImage`
   - `searchResultInfo`
   - `searchResultName`
   - `searchResultCategory`
   - `addIconButton`

**Estimated Time:** 20 minutes

---

### Phase 4: Refactor ShoppingListsScreen
**Tasks:**
1. Import GrocerySearchBar component
2. Remove local state:
   - `searchQuery`
   - `showSearchDropdown`
   - Search-related state management
3. Remove search logic and filtering
4. Replace search bar JSX with `<GrocerySearchBar />`
5. Pass required props:
   - `items={mockGroceriesDB}`
   - `onSelectItem={handleSelectGroceryItem}`
   - `onQuickAddItem={handleQuickAddItem}`
   - `variant="surface"` (white background)
   - `showShadow={true}`
6. Remove unused styles:
   - `searchBarContainer`
   - `searchBar`
   - `searchInput`
   - `searchDropdown`
   - `searchDropdownScroll`
   - `searchResultItem`
   - `searchResultContent`
   - `searchResultImage`
   - `searchResultDetails`
   - `searchResultName`
   - `searchResultCategory`
   - `addIconButton`

**Estimated Time:** 20 minutes

---

### Phase 5: Testing & Cleanup
**Tasks:**
1. Test ShoppingQuickActionModal:
   - Search functionality works
   - Dropdown appears/dismisses correctly
   - Item selection works
   - Quick add works
   - Clear button works
2. Test ShoppingListsScreen:
   - All above tests
   - Verify styling matches original
3. Check for any console errors or warnings
4. Verify TypeScript compilation
5. Test on different screen sizes (if applicable)
6. Clean up any remaining unused code

**Estimated Time:** 30 minutes

---

## 🎨 Design Decisions

### Best Practices from Both Implementations

| Feature | Source | Reason |
|---------|--------|--------|
| White background | ShoppingListsScreen | More polished, better contrast |
| Box shadow | ShoppingListsScreen | Better visual hierarchy |
| Absolute positioning | ShoppingListsScreen | Better dropdown behavior |
| Proper z-index | ShoppingListsScreen | Prevents overlap issues |
| nestedScrollEnabled | ShoppingQuickActionModal | Better nested scroll handling |
| Result limit (8 items) | ShoppingQuickActionModal | Prevents overwhelming UI |
| Icon size (20px) | ShoppingQuickActionModal | Better balance |

### Component Flexibility

The component will be **flexible** enough to support:
- ✅ Different background colors (variant prop)
- ✅ Shadow on/off (showShadow prop)
- ✅ Custom placeholders
- ✅ Controlled/uncontrolled modes
- ✅ Style overrides for edge cases
- ✅ Configurable result limit

---

## ✅ Expected Benefits

### Code Quality
- ✨ **Single Source of Truth** - One implementation to maintain
- ✨ **DRY Principle** - No code duplication
- ✨ **Type Safety** - Shared TypeScript interfaces
- ✨ **Testability** - Can unit test one component

### User Experience
- 🎯 **Consistency** - Identical UI/UX across screens
- 🎯 **Reliability** - Bug fixes apply everywhere
- 🎯 **Performance** - Optimized once, benefits all

### Developer Experience
- 🚀 **Reusability** - Easy to add to new screens
- 🚀 **Maintainability** - Update once, affects all
- 🚀 **Discoverability** - Clear location in common folder
- 🚀 **Documentation** - Single place to document behavior

---

## 🚧 Potential Challenges & Mitigation

### Challenge 1: Different Dropdown Positioning
**Problem:** Modal vs screen positioning differences  
**Solution:** Use absolute positioning with proper z-index, let parent handle container styles

### Challenge 2: State Management
**Problem:** Some screens may want controlled state  
**Solution:** Support both controlled and uncontrolled modes via optional props

### Challenge 3: Style Customization
**Problem:** Future screens may need different styling  
**Solution:** Accept `containerStyle` and `dropdownStyle` props for overrides

### Challenge 4: Breaking Changes
**Problem:** Refactoring may introduce bugs  
**Solution:** Thorough testing of both implementations before/after

---

## 📊 Success Criteria

- [ ] GrocerySearchBar component created with all features
- [ ] ShoppingQuickActionModal uses new component successfully
- [ ] ShoppingListsScreen uses new component successfully
- [ ] Both screens maintain exact same functionality as before
- [ ] Both screens have consistent styling (can differ if variant prop used)
- [ ] No TypeScript errors
- [ ] No runtime errors or warnings
- [ ] Code is cleaner and more maintainable
- [ ] At least 100 lines of code removed from original files

---

## 🔄 Future Enhancements (Out of Scope)

These could be added later:
- [ ] Add debouncing for search (300ms delay)
- [ ] Add loading states for async search
- [ ] Add empty state customization
- [ ] Add keyboard navigation (arrow keys)
- [ ] Add search result highlighting
- [ ] Add recent searches functionality
- [ ] Add unit tests for search logic
- [ ] Add Storybook stories for documentation
- [ ] Support custom result item renderer
- [ ] Add analytics tracking for searches

---

## 📚 Related Files

### Files to Create
- `src/components/common/GrocerySearchBar/GrocerySearchBar.tsx`
- `src/components/common/GrocerySearchBar/types.ts`
- `src/components/common/GrocerySearchBar/styles.ts`
- `src/components/common/GrocerySearchBar/index.ts`

### Files to Modify
- `src/components/modals/ShoppingQuickActionModal.tsx`
- `src/screens/shopping/ShoppingListsScreen.tsx`

### Files to Reference
- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/borderRadius.ts`
- `src/theme/shadows.ts`

---

## 🎬 Next Steps

1. **Review this plan** with team/stakeholders
2. **Get approval** to proceed
3. **Start implementation** following the phases
4. **Test thoroughly** after each phase
5. **Create PR** with clear description
6. **Get code review** before merging
7. **Deploy** and monitor for issues
8. **Document** the new component in project docs

---

**Status:** ✅ Plan Complete - Ready for Implementation
