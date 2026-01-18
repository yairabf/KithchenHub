---
name: Add Swipe to Delete
overview: "Implement Gmail-style swipe gesture on chore items: first swipe reveals delete icon, second swipe removes the item from the list. Works for both left and right swipe directions."
todos:
  - id: create-swipeable
    content: Create SwipeableChoreCard component with gesture handling
    status: completed
  - id: integrate-chores
    content: Integrate SwipeableChoreCard into ChoresScreen
    status: completed
    dependencies:
      - create-swipeable
  - id: test-swipe
    content: Test swipe functionality on chore items
    status: completed
    dependencies:
      - integrate-chores
---

# Add Swipe to Delete for Chore Items

## Overview

Implement a Gmail-style two-stage swipe gesture for chore items in the ChoresScreen. The first swipe will reveal a delete icon behind the item, and a second swipe (or continuing the swipe) will remove the item from the list. Both left and right swipe directions will work.

## Implementation Approach

### 1. Create SwipeableChoreCard Component

**New File:** `src/components/chores/SwipeableChoreCard.tsx`

Create a reusable swipeable wrapper component using `react-native-gesture-handler` and `react-native-reanimated`:

- **Use PanGestureHandler** from react-native-gesture-handler for swipe detection
- **Implement two-stage swipe logic:**
- Stage 1 (0-80px): Item moves partially, revealing delete background
- Stage 2 (80px+): Item moves fully off screen, triggers delete callback
- **Animated delete background** that appears behind the swiped item
- Red background color
- Trash icon (Ionicons `trash-outline`)
- Scales/fades in as swipe progresses
- **Support both directions:** Left and right swipes both trigger the same delete action
- **Smooth spring animations** for snap-back when swipe is released before threshold
- **Props interface:**
- `children`: The chore card content
- `onDelete`: Callback when item should be deleted
- `backgroundColor`: The chore card's background color (for visual continuity)

### 2. Update ChoresScreen

**File:** [`src/screens/ChoresScreen.tsx`](src/screens/ChoresScreen.tsx)

- **Import SwipeableChoreCard** component
- **Add handleDeleteChore function:**
- Remove chore from state by filtering out the deleted chore ID
- Optionally show a brief toast/confirmation (future enhancement)
- **Wrap renderChoreCard content** in SwipeableChoreCard:
- Extract the current TouchableOpacity content into the children
- Pass the chore's backgroundColor to SwipeableChoreCard
- Pass handleDeleteChore as the onDelete callback
- **Keep existing functionality intact:**
- Toggle completion on tap
- Edit button functionality
- All styling preserved

### 3. Animation Details

**Gesture Behavior:**

- **Pan gesture** tracks horizontal translation
- **Threshold at 80px** (configurable constant)
- **Velocity consideration:** Fast swipes trigger delete even if threshold not fully reached
- **Visual feedback:**
- Delete background opacity: 0 → 1 as swipe progresses (0-80px)
- Delete icon scale: 0.5 → 1 as swipe progresses
- Card translation follows finger with slight resistance after threshold

**Spring-back Animation:**

- If swipe released before threshold: animate back to x=0
- Use `withSpring` for natural feel

**Delete Animation:**

- If swipe exceeds threshold: continue sliding off screen
- Fade out simultaneously
- Call onDelete callback when animation completes
- Use `runOnJS` to trigger React state update

### 4. Styling Considerations

- **Delete background** positioned absolutely behind the card
- **Match card height** dynamically
- **Border radius** matches the chore card (borderRadius.lg)
- **Z-index layering:** Background behind, card on top
- **Icon positioning:** Centered vertically, positioned at edges (left/right based on swipe direction)

## Technical Notes

- `react-native-gesture-handler` is already installed and configured
- `react-native-reanimated` is available for smooth animations
- The component should work within ScrollView (simultaneousHandlers may be needed)
- Consider adding `activeOffsetX` to prevent accidental swipes during vertical scrolling
- The swipe component should be generic enough to potentially reuse for shopping items later

## Files to Modify/Create

1. **Create:** `src/components/chores/SwipeableChoreCard.tsx` - New swipeable wrapper component
2. **Update:** `src/components/chores/index.ts` - Export the new component
3. **Update:** `src/screens/ChoresScreen.tsx` - Integrate swipeable cards and add delete handler