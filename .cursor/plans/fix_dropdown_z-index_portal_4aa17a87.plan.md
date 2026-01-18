---
name: Fix Dropdown Z-Index Portal
overview: Implement react-native-portal to render the GrocerySearchBar dropdown outside the ScrollView, fixing the z-index overlay issue in the Recipe Modal.
todos:
  - id: install_portal
    content: Install react-native-portal library
    status: completed
  - id: wrap_app
    content: Add PortalProvider to App.tsx root
    status: completed
  - id: update_grocery_search
    content: Refactor GrocerySearchBar to use Portal for dropdown
    status: completed
  - id: update_styles
    content: Update dropdown styles for Portal positioning
    status: completed
  - id: add_backdrop
    content: Add backdrop overlay for closing dropdown
    status: completed
  - id: test_portal
    content: Test dropdown overlay and click functionality
    status: in_progress
---

# Fix Dropdown Z-Index Using Portal

## Overview

Restructure the GrocerySearchBar component to use `react-native-portal` library, allowing the dropdown to render outside the ScrollView and properly overlay all content below it.

## Implementation Steps

### 1. Install react-native-portal Library

**Command:**

```bash
npm install react-native-portal
```

This library provides a Portal component that renders children at the root level of the app, outside the normal component hierarchy.

### 2. Wrap App with PortalProvider

**File:** [`App.tsx`](App.tsx)

Add the `PortalProvider` at the root level to enable Portal functionality throughout the app:

```typescript
import { PortalProvider } from 'react-native-portal';

export default function App() {
  return (
    <PortalProvider>
      {/* existing app content */}
    </PortalProvider>
  );
}
```

### 3. Update GrocerySearchBar Component

**File:** [`src/components/common/GrocerySearchBar/GrocerySearchBar.tsx`](src/components/common/GrocerySearchBar/GrocerySearchBar.tsx)

**Changes needed:**

- Import `Portal` from `react-native-portal`
- Wrap the dropdown in a `<Portal>` component
- Add state to track dropdown position for absolute positioning
- Use `onLayout` to measure search bar position
- Calculate dropdown position relative to viewport

**Key implementation:**

```typescript
import { Portal } from 'react-native-portal';
import { View, TextInput, ScrollView, Image, Text } from 'react-native';

export function GrocerySearchBar({ ... }) {
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchBarRef = useRef<View>(null);

  const handleLayout = () => {
    searchBarRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({
        top: y + height,
        left: x,
        width: width,
      });
    });
  };

  return (
    <View ref={searchBarRef} onLayout={handleLayout}>
      {/* Search bar */}
      
      {showDropdown && (
        <Portal>
          <View style={[
            styles.searchDropdown,
            {
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }
          ]}>
            {/* Dropdown content */}
          </View>
        </Portal>
      )}
    </View>
  );
}
```

### 4. Update Dropdown Styles

**File:** [`src/components/common/GrocerySearchBar/styles.ts`](src/components/common/GrocerySearchBar/styles.ts)

Remove the `position: 'absolute'` and positioning from the dropdown style since it will now be positioned via inline styles:

```typescript
searchDropdown: {
  // Remove: position: 'absolute', top: 52, left: 0, right: 0
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  maxHeight: 300,
  overflow: 'hidden',
  ...shadows.xl,
  pointerEvents: 'auto',
  zIndex: 10000,
  elevation: 10000,
},
```

### 5. Add Backdrop/Overlay (Optional but Recommended)

Add a transparent backdrop that closes the dropdown when tapped outside:

```typescript
{showDropdown && (
  <Portal>
    <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
      <View style={styles.backdrop} />
    </TouchableWithoutFeedback>
    <View style={[styles.searchDropdown, { ... }]}>
      {/* Dropdown content */}
    </View>
  </Portal>
)}
```

**Backdrop style:**

```typescript
backdrop: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'transparent',
},
```

### 6. Handle Scroll and Window Resize

Add listeners to update dropdown position when the modal scrolls or window resizes:

```typescript
useEffect(() => {
  if (showDropdown) {
    handleLayout();
  }
}, [showDropdown]);
```

## Testing Checklist

- [ ] Install react-native-portal successfully
- [ ] PortalProvider wraps the app
- [ ] Dropdown renders outside ScrollView
- [ ] Dropdown appears at correct position below search bar
- [ ] Dropdown overlays Steps section properly
- [ ] Clicking + button works without interception
- [ ] Clicking ingredient names works
- [ ] Backdrop closes dropdown when clicked
- [ ] Dropdown position updates on scroll (if needed)
- [ ] No visual glitches or positioning issues
- [ ] Works on both web and mobile

## Benefits

1. **Proper Z-Index**: Dropdown renders at root level, always on top
2. **Click Events Work**: No more pointer event interception
3. **Clean Solution**: Uses established library pattern
4. **Maintainable**: Standard Portal pattern used across React ecosystem
5. **Performant**: Portal rendering is optimized in React Native

## Alternative Considered

We considered building a custom Portal using React Context, but `react-native-portal` is:

- Well-tested and maintained
- Handles edge cases (positioning, cleanup)
- Smaller bundle size than alternatives
- Works consistently across web and native