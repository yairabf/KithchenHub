---
name: Unify Chore Cards
overview: Create a single unified chore card component with consistent sizing and styling, using a full-width list layout for both Today's and Upcoming sections.
todos:
  - id: merge-renderers
    content: Create unified renderChoreCard function to replace both card renderers
    status: completed
  - id: merge-styles
    content: Consolidate card styles into single choreCard and choreCardCheck styles
    status: completed
  - id: update-layouts
    content: Convert both sections from grid/list to consistent list layout
    status: completed
  - id: test-display
    content: Verify cards display consistently in both Today and Upcoming sections
    status: completed
---

# Unify Chore Card Components

## Changes to [`src/screens/ChoresScreen.tsx`](src/screens/ChoresScreen.tsx)

### 1. Create Single Unified Card Renderer

Replace the two separate card renderers (`renderTodayChoreCard` and `renderUpcomingChoreCard`) with a single unified `renderChoreCard` function that:

- Uses consistent sizing: 26px icon, 26px checkmark container (middle ground)
- Has uniform padding and spacing
- Maintains the same visual structure for all cards
- Still accepts the chore data and color index as parameters

### 2. Update Card Styles

Merge `todayCard` and `upcomingCard` styles into a single `choreCard` style:

- Full-width layout (remove `minWidth: '48%'`, `maxWidth: '48.5%'`)
- Consistent padding: `spacing.md`
- Icon size: 26px
- Checkmark container: 26x26px
- Font sizes: 14px for name, 11px for time (balanced between current sizes)

Merge `todayCardCheck` and `upcomingCardCheck` into single `choreCardCheck` style (26x26px).

### 3. Convert Both Sections to List Layout

- Replace `todayGrid` style (which uses `flexWrap: 'wrap'`) with a list-based layout
- Both "TODAY'S CHORES" and "UPCOMING CHORES" sections will use the same `choreList` style with `gap: spacing.sm`
- Remove the 2-column grid behavior entirely

### 4. Update Rendering Logic

Both sections will now render identically:

```typescript
<View style={styles.choreList}>
  {todayChores.map(renderChoreCard)}
</View>
```
```typescript
<View style={styles.choreList}>
  {upcomingChores.map(renderChoreCard)}
</View>
```

### 5. Maintain Color Assignment

Keep the existing color rotation logic so cards still get pastel colors from the `choreColors` array based on their index.

## Result

- Single, consistent chore card design across the entire app
- Both sections use clean, full-width list layouts
- Only difference between sections is their location and which chores they display
- Easier to maintain and extend in the future