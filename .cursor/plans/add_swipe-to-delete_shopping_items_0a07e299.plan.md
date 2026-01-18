---
name: Add Swipe-to-Delete Shopping Items
overview: Add swipe-to-delete functionality to shopping list items in ShoppingListsScreen, mirroring the implementation from SwipeableChoreCard.
todos:
  - id: create-swipeable-component
    content: Create SwipeableShoppingItem component with gesture handling
    status: completed
  - id: integrate-shopping-screen
    content: Integrate swipeable wrapper in ShoppingListsScreen
    status: completed
    dependencies:
      - create-swipeable-component
---

# Add Swipe-to-Delete for Shopping List Items

## Overview

Implement swipe-to-delete functionality for shopping list items in the main ShoppingListsScreen, using the same gesture-based approach as the chores feature.

## Implementation Steps

### 1. Create SwipeableShoppingItem Component

Create a new reusable component at [`src/components/shopping/SwipeableShoppingItem.tsx`](src/components/shopping/SwipeableShoppingItem.tsx) based on the existing [`src/components/chores/SwipeableChoreCard.tsx`](src/components/chores/SwipeableChoreCard.tsx).

**Key features:**

- Pan gesture handling with `react-native-gesture-handler`
- Animated swipe with `react-native-reanimated`
- 30% screen width threshold for deletion
- Velocity-based fast swipe detection (1000 threshold)
- Red background with trash icon revealed on swipe
- Bidirectional swipe support (left or right)
- Smooth spring animations for snap-back
- Auto-slide off screen on successful delete

**Differences from chores:**

- Accept shopping item-specific props (image, quantity controls, category)
- Use `colors.shopping` theme color instead of chore-specific colors
- Maintain the horizontal layout with image, details, and quantity controls

### 2. Update ShoppingListsScreen

Modify [`src/screens/shopping/ShoppingListsScreen.tsx`](src/screens/shopping/ShoppingListsScreen.tsx) to integrate the swipeable component.

**Changes needed:**

- Import `SwipeableShoppingItem` component
- Wrap each item in the `itemsList` section (lines 518-541) with the swipeable wrapper
- Add `handleDeleteItem` function to remove items from state
- Pass the item's content as children to `SwipeableShoppingItem`
- Maintain existing functionality (quantity controls, item selection)

**Current item structure to wrap:**

```518:541:src/screens/shopping/ShoppingListsScreen.tsx
{filteredItems.map((item) => (
  <View key={item.id} style={styles.itemRow}>
    <Image source={{ uri: item.image }} style={styles.itemImage} />
    <View style={styles.itemDetails}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemCategory}>{item.category}</Text>
    </View>
    <View style={styles.quantityControls}>
      <TouchableOpacity
        style={styles.quantityBtn}
        onPress={() => handleQuantityChange(item.id, -1)}
      >
        <Text style={styles.quantityBtnText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.quantity}>{item.quantity}</Text>
      <TouchableOpacity
        style={styles.quantityBtn}
        onPress={() => handleQuantityChange(item.id, 1)}
      >
        <Text style={styles.quantityBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
))}
```

### 3. Export Component

Update [`src/components/shopping/index.ts`](src/components/shopping/index.ts) to export the new `SwipeableShoppingItem` component (if this file doesn't exist, the component will be imported directly).

## Technical Details

**Dependencies (already in project):**

- `react-native-gesture-handler` - Pan gesture detection
- `react-native-reanimated` - Smooth animations
- `@expo/vector-icons` - Trash icon

**Animation Parameters:**

- Delete threshold: 30% of screen width
- Velocity threshold: 1000 for fast swipes
- Spring config: `{ damping: 20, stiffness: 300 }`
- Slide-off duration: 300ms

**User Experience:**

- Swipe left or right to reveal red delete background
- Trash icon scales and fades in as user swipes
- Cross 30% threshold OR swipe fast to trigger deletion
- Item automatically slides off screen before removal
- Snap back with spring animation if threshold not met
- Direction locks after initial movement to prevent jitter

## Files to Modify/Create

1. **Create:** [`src/components/shopping/SwipeableShoppingItem.tsx`](src/components/shopping/SwipeableShoppingItem.tsx)
2. **Modify:** [`src/screens/shopping/ShoppingListsScreen.tsx`](src/screens/shopping/ShoppingListsScreen.tsx)