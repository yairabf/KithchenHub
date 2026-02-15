# Kitchen Hub Design System

**Version 1.0** | Last Updated: February 2026

This document defines the design system for Kitchen Hub's mobile application. It ensures consistent UI/UX across all features and provides reusable patterns for future development.

---

## Table of Contents

1. [Theme System](#theme-system)
2. [Colors](#colors)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Shadows & Elevation](#shadows--elevation)
6. [Common Components](#common-components)
7. [Animation Patterns](#animation-patterns)
8. [Loading States](#loading-states)
9. [Empty States](#empty-states)
10. [Best Practices](#best-practices)

---

## Theme System

All theme values are centralized in `/mobile/src/theme/` and exported through a single index:

```typescript
import { colors, spacing, typography, shadows, borderRadius } from '../../../theme';
```

### Theme Structure

```
mobile/src/theme/
├── colors.ts      # Color palette and helpers
├── spacing.ts     # Spacing scales, border radius, icon sizes, z-index
├── typography.ts  # Text styles
├── shadows.ts     # Shadow/elevation definitions
└── index.ts       # Barrel export
```

---

## Colors

### Brand Colors

Kitchen Hub uses an **earthy, natural palette** that conveys warmth and home.

```typescript
colors.primary        // '#606c38' - Olive green (main brand)
colors.primaryLight   // '#dda15e' - Golden/honey (lighter accents)
colors.primaryDark    // '#283618' - Dark forest green (pressed/active)
colors.secondary      // '#bc6c25' - Warm brown (accents, links)
```

### Background Colors

```typescript
colors.background     // '#F5F5F0' - Warm cream (main app background)
colors.surface        // '#FFFFFF' - White (cards, modals)
colors.surfaceGlass   // 'rgba(255, 255, 255, 0.4)' - Glassmorphism
```

### Section Accent Colors

Each feature section has a distinct accent color:

```typescript
colors.shopping       // '#606c38' - Olive green
colors.recipes        // '#bc6c25' - Warm brown
colors.chores         // '#283618' - Dark forest green
```

### Text Colors

```typescript
colors.textPrimary    // '#2D3139' - Main text
colors.textSecondary  // '#6B7280' - Subtitles, hints
colors.textMuted      // '#9CA3AF' - Muted text
colors.textLight      // '#FFFFFF' - Text on dark backgrounds
```

### State Colors

```typescript
colors.success        // '#606c38' - Success states
colors.warning        // '#F59E0B' - Warning states
colors.error          // '#EF4444' - Error states
```

### UI Element Colors

```typescript
colors.border         // '#E5E7EB' - Standard borders
colors.borderDashed   // '#CBD5E1' - Dashed borders
colors.divider        // '#F0F0F0' - Section dividers
colors.backdrop       // 'rgba(30, 41, 59, 0.4)' - Modal backdrop
colors.quantityBg     // '#F3F4F6' - Quantity control backgrounds
colors.addButton      // '#dda15e' - Add button accent
```

### Pastel Palette (Decorative)

Used for card backgrounds and decorative elements:

```typescript
colors.pastel.cyan      // '#E8E4D9' - Warm gray
colors.pastel.green     // '#D4DBC4' - Sage
colors.pastel.peach     // '#F5E6C8' - Soft wheat
colors.pastel.coral     // '#E8D4B8' - Tan
colors.pastel.lavender  // '#D6CFC4' - Taupe
colors.pastel.yellow    // '#F0E5D0' - Light cream

// Access as array for indexed usage:
import { pastelColors } from '../../../theme';
const cardColor = pastelColors[index % pastelColors.length];
```

### Transparent Variants

```typescript
colors.transparent.white50  // 'rgba(255, 255, 255, 0.5)'
colors.transparent.white60  // 'rgba(255, 255, 255, 0.6)'
colors.transparent.white70  // 'rgba(255, 255, 255, 0.7)'
colors.transparent.white80  // 'rgba(255, 255, 255, 0.8)'
colors.transparent.black10  // 'rgba(0, 0, 0, 0.1)'
```

### Color Helper Function

```typescript
import { withOpacity } from '../../../theme';

// Add opacity to any hex color
const semiTransparentPrimary = withOpacity(colors.primary, 0.5);
// Returns: 'rgba(96, 108, 56, 0.5)'
```

---

## Typography

All typography styles are defined as StyleSheet objects and can be spread directly into components.

### Display & Headings

```typescript
// Hero/Greeting text
typography.display
// fontSize: 48, fontWeight: '900', letterSpacing: -2

// Heading levels
typography.h1  // fontSize: 32, fontWeight: '700'
typography.h2  // fontSize: 24, fontWeight: '600'
typography.h3  // fontSize: 20, fontWeight: '800', letterSpacing: -0.5
typography.h4  // fontSize: 18, fontWeight: '600'
```

**Usage:**

```typescript
<Text style={typography.h2}>Your Heading</Text>
```

### Body Text

```typescript
typography.bodyLarge  // fontSize: 18, fontWeight: '500'
typography.body       // fontSize: 16, fontWeight: '400' (default)
typography.bodySmall  // fontSize: 14, fontWeight: '400'
```

### Labels & Captions

```typescript
typography.label      // fontSize: 14, fontWeight: '500'
typography.labelBold  // fontSize: 14, fontWeight: '700'
typography.caption    // fontSize: 12, fontWeight: '400', color: textSecondary
typography.captionBold // fontSize: 12, fontWeight: '800', letterSpacing: 0.5
```

### Tiny Text (Roles, Tags)

```typescript
typography.tiny        // fontSize: 10, fontWeight: '700', letterSpacing: 1
typography.tinyMuted   // fontSize: 11, fontWeight: '500'
```

### Section Titles

```typescript
typography.sectionTitle       // fontSize: 12, fontWeight: '800', uppercase
typography.sectionTitleMuted  // fontSize: 11, fontWeight: '700', uppercase, muted
```

### Button Text

```typescript
typography.button       // fontSize: 16, fontWeight: '600'
typography.buttonSmall  // fontSize: 14, fontWeight: '600'
```

### Widget/Card Titles

```typescript
typography.widgetTitle  // fontSize: 22, fontWeight: '900', letterSpacing: -0.5
```

---

## Spacing & Layout

### Spacing Scale

Use the spacing scale for all margins, padding, and gaps:

```typescript
spacing.xxs   // 2
spacing.xs    // 4
spacing.sm    // 8
spacing.md    // 16 (standard)
spacing.lg    // 24
spacing.xl    // 32
spacing.xxl   // 48
```

**Usage:**

```typescript
const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
});
```

### Border Radius

```typescript
borderRadius.xs    // 2
borderRadius.sm    // 4
borderRadius.md    // 8 (standard)
borderRadius.lg    // 12
borderRadius.xl    // 16
borderRadius.xxl   // 24 (overview cards)
borderRadius.xxxl  // 40 (pill navigation)
borderRadius.pill  // 48 (main action cards)
borderRadius.full  // 9999 (circular)
```

### Icon Sizes

```typescript
iconSize.xs   // 12
iconSize.sm   // 16
iconSize.md   // 24 (standard)
iconSize.lg   // 32
iconSize.xl   // 48
```

### Component Sizes

```typescript
// Avatars
componentSize.avatar.sm   // 32
componentSize.avatar.md   // 44
componentSize.avatar.lg   // 56

// Buttons
componentSize.button.sm   // 28
componentSize.button.md   // 40
componentSize.button.lg   // 56

// Icon containers
componentSize.icon.container.sm   // 32
componentSize.icon.container.md   // 56
componentSize.icon.container.lg   // 80

// Checkboxes
componentSize.checkbox   // 24
```

### Z-Index Layers

Maintain consistent stacking order:

```typescript
zIndex.base       // 0
zIndex.dropdown   // 1000
zIndex.modal      // 2000
zIndex.tooltip    // 3000
zIndex.overlay    // 4000
```

---

## Shadows & Elevation

Kitchen Hub uses the React Native New Architecture's `boxShadow` API (avoids deprecated `shadow*` props).

### Shadow Levels

```typescript
shadows.none   // No shadow
shadows.sm     // Subtle shadow (cards)
shadows.md     // Medium shadow (raised cards)
shadows.lg     // Large shadow (modals)
shadows.xl     // Extra large shadow
shadows.float  // Floating shadow (FAB)
shadows.deep   // Deep shadow (overlays)
```

**Usage:**

```typescript
const styles = StyleSheet.create({
  card: {
    ...shadows.md,
    // Also sets elevation for Android
  },
});
```

### Custom Shadow Helper

```typescript
import { boxShadow } from '../../../theme';

const customShadow = boxShadow(
  4,              // offsetY
  8,              // blurRadius
  'rgba(0,0,0,0.1)', // color
  0               // offsetX (optional)
);

const styles = StyleSheet.create({
  container: {
    ...customShadow,
  },
});
```

---

## Common Components

Kitchen Hub provides a library of reusable components in `/mobile/src/common/components/`.

### ListItemCardWrapper

A standard card wrapper for list items (shopping items, chores, recipes).

**Location:** `/mobile/src/common/components/ListItemCardWrapper/`

**Features:**
- Standard padding (`md + xs`)
- Border radius (`xxl`)
- Shadow and border
- Customizable background color
- Optional press handling

**Usage:**

```typescript
import { ListItemCardWrapper } from '../../../common/components/ListItemCardWrapper';

<ListItemCardWrapper
  backgroundColor={colors.surface}
  onPress={() => handlePress()}
  style={{ marginBottom: spacing.sm }}
>
  {/* Your content */}
</ListItemCardWrapper>
```

### CenteredModal

A reusable centered modal with consistent styling and animations.

**Location:** `/mobile/src/common/components/CenteredModal/`

**Features:**
- Fade + scale animations
- Standard header with close button
- Optional action buttons (Cancel + Confirm)
- Customizable confirm button color
- Loading state support

**Usage:**

```typescript
import { CenteredModal } from '../../../common/components/CenteredModal';

<CenteredModal
  visible={showModal}
  onClose={handleClose}
  title="Add Item"
  confirmText="Add"
  onConfirm={handleAdd}
  confirmColor={colors.shopping}
  confirmDisabled={!isValid}
  confirmLoading={isSubmitting}
>
  {/* Your form content */}
</CenteredModal>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | boolean | - | Modal visibility |
| `onClose` | function | - | Close handler |
| `title` | string | - | Modal title |
| `children` | ReactNode | - | Modal content |
| `confirmText` | string | 'Confirm' | Confirm button text |
| `cancelText` | string | 'Cancel' | Cancel button text |
| `onConfirm` | function | - | Confirm handler |
| `confirmColor` | string | `colors.primary` | Confirm button color |
| `confirmDisabled` | boolean | false | Disable confirm button |
| `confirmLoading` | boolean | false | Show loading spinner |
| `showActions` | boolean | true | Show action buttons |

### ConfirmationModal

A specialized modal for confirmations (e.g., delete actions).

**Location:** `/mobile/src/common/components/ConfirmationModal/`

**Usage:**

```typescript
import { ConfirmationModal } from '../../../common/components/ConfirmationModal';

<ConfirmationModal
  visible={showDeleteModal}
  title="Delete Item?"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  confirmColor={colors.error}
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteModal(false)}
/>
```

### FloatingActionButton (FAB)

A floating action button with flexible positioning.

**Location:** `/mobile/src/common/components/FloatingActionButton/`

**Features:**
- Three position modes: inline, absolute-right, bottom-center
- Customizable size, colors, and icons
- Accessibility support

**Usage:**

```typescript
import { FloatingActionButton } from '../../../common/components/FloatingActionButton';

// Inline (rendered in layout flow)
<FloatingActionButton
  onPress={handleAdd}
  iconName="add"
  backgroundColor={colors.shopping}
  position="inline"
/>

// Absolute positioned (top-right)
<FloatingActionButton
  onPress={handleAdd}
  position="absolute-right"
  topOffset={56}
  rightOffset={16}
/>

// Bottom center (above bottom nav)
<FloatingActionButton
  onPress={handleAdd}
  position="bottom-center"
  bottomOffset={100}
/>
```

### EmptyState

A consistent empty state component with icon, text, and optional action.

**Location:** `/mobile/src/common/components/EmptyState/`

**Usage:**

```typescript
import { EmptyState } from '../../../common/components/EmptyState';

<EmptyState
  icon="cart-outline"
  title="No Items Yet"
  description="Start adding items to your shopping list"
  actionLabel="Add First Item"
  onActionPress={handleAdd}
  iconColor={colors.shopping}
  actionColor={colors.shopping}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | - | Ionicons icon name |
| `title` | string | - | Empty state title |
| `description` | string | - | Optional description |
| `actionLabel` | string | - | Action button label |
| `onActionPress` | function | - | Action handler |
| `iconColor` | string | `colors.textMuted` | Icon color |
| `actionColor` | string | `colors.primary` | Action button color |

### SafeImage

A safe image component with fallback support.

**Location:** `/mobile/src/common/components/SafeImage/`

**Features:**
- Automatic error handling
- Fallback icon on failure
- Customizable placeholder

**Usage:**

```typescript
import { SafeImage } from '../../../common/components/SafeImage';

<SafeImage
  source={{ uri: recipe.imageUrl }}
  style={{ width: 200, height: 200 }}
  fallbackIcon="image-outline"
  fallbackIconColor={colors.textMuted}
/>
```

### Toast

A toast notification component.

**Location:** `/mobile/src/common/components/Toast/`

**Usage:**

```typescript
import { Toast } from '../../../common/components/Toast';

// In your component state:
const [toastVisible, setToastVisible] = useState(false);
const [toastMessage, setToastMessage] = useState('');

// Show toast:
setToastMessage('Item added successfully');
setToastVisible(true);

// Render:
<Toast
  visible={toastVisible}
  message={toastMessage}
  onDismiss={() => setToastVisible(false)}
  duration={3000}
/>
```

### SyncStatusIndicator

Shows synchronization status for real-time features.

**Location:** `/mobile/src/common/components/SyncStatusIndicator/`

**Usage:**

```typescript
import { SyncStatusIndicator } from '../../../common/components/SyncStatusIndicator';

<SyncStatusIndicator status="syncing" />
// status: 'synced' | 'syncing' | 'error'
```

---

## Animation Patterns

Kitchen Hub uses **react-native-reanimated** for performant animations.

### Fade + Scale (Modal Entry)

**Pattern:** Modals and overlays fade in with a subtle scale effect.

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const opacity = useSharedValue(0);
const scale = useSharedValue(0.8);

useEffect(() => {
  if (visible) {
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  } else {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });
  }
}, [visible]);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));

return <Animated.View style={animatedStyle}>{children}</Animated.View>;
```

### Slide + Fade (Screen Entry)

**Pattern:** Screen content slides up and fades in.

```typescript
import { Animated } from 'react-native';

const fadeAnim = React.useRef(new Animated.Value(0)).current;
const slideAnim = React.useRef(new Animated.Value(20)).current;

useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }),
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

return (
  <Animated.View
    style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }}
  >
    {children}
  </Animated.View>
);
```

### Looping Animations (Background Decorations)

**Pattern:** Continuous floating/pulsing animations for decorative elements.

```typescript
import { Animated } from 'react-native';

const orbAnim = React.useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(orbAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(orbAnim, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: true,
      }),
    ])
  ).start();
}, []);
```

### Progress Ring Animation

**Pattern:** Animated circular progress with smooth color transitions.

**Example:** See `/mobile/src/features/chores/components/ProgressRing/`

```typescript
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const animatedProgress = useSharedValue(0);

useEffect(() => {
  animatedProgress.value = withTiming(progress, {
    duration: 1000,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
}, [progress]);

const animatedProps = useAnimatedProps(() => {
  'worklet';
  const progressOffset = circumference - (animatedProgress.value / 100) * circumference;
  return { strokeDashoffset: progressOffset };
});

<AnimatedCircle animatedProps={animatedProps} />;
```

### Shimmer Animation

**Pattern:** Loading skeleton shimmer effect (see SkeletonLoader).

```typescript
const shimmerTranslate = useSharedValue(0);

useEffect(() => {
  shimmerTranslate.value = withRepeat(
    withTiming(1, { duration: 1500 }),
    -1,
    false
  );
}, []);

const animatedStyle = useAnimatedStyle(() => {
  const translateX = interpolate(
    shimmerTranslate.value,
    [0, 1],
    [-width, width]
  );
  return { transform: [{ translateX }] };
});
```

### Spring Animations (Interactive Elements)

**Pattern:** Use springs for natural, physics-based interactions.

```typescript
scale.value = withSpring(1, { damping: 20, stiffness: 300 });
```

---

## Loading States

Kitchen Hub uses skeleton loaders for loading states rather than generic spinners.

### SkeletonLoader

A base animated shimmer loader.

**Location:** `/mobile/src/common/components/SkeletonLoader/`

**Usage:**

```typescript
import { SkeletonLoader } from '../../../common/components/SkeletonLoader';
import { borderRadius } from '../../../theme';

<SkeletonLoader
  width={200}
  height={16}
  borderRadius={borderRadius.xs}
  style={{ marginBottom: spacing.xs }}
/>
```

### ListItemSkeleton

A pre-composed skeleton for list items.

**Location:** `/mobile/src/common/components/ListItemSkeleton/`

**Usage:**

```typescript
import { ListItemSkeleton } from '../../../common/components/ListItemSkeleton';

{isLoading ? (
  <>
    <ListItemSkeleton />
    <ListItemSkeleton />
    <ListItemSkeleton />
  </>
) : (
  items.map(item => <ItemComponent key={item.id} item={item} />)
)}
```

**Structure:**
- Icon/image placeholder (48x48)
- Text content (2 lines)
- Action/checkbox placeholder

### CardSkeleton

A pre-composed skeleton for card-based layouts (recipes, etc.).

**Location:** `/mobile/src/common/components/CardSkeleton/`

**Usage:**

```typescript
import { CardSkeleton } from '../../../common/components/CardSkeleton';

{isLoading ? (
  <>
    <CardSkeleton width={cardWidth} />
    <CardSkeleton width={cardWidth} />
  </>
) : (
  recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)
)}
```

**Structure:**
- Image placeholder (60% of card height)
- Text content (2 lines)

### Loading Best Practices

1. **Always use skeleton loaders** instead of generic spinners
2. **Match skeleton structure** to actual content layout
3. **Show 3-4 skeleton items** for lists
4. **Animate skeletons** with shimmer effect (built-in)
5. **Preserve layout** - skeletons should occupy same space as real content

---

## Empty States

Empty states should be helpful and actionable.

### Empty State Anatomy

1. **Icon** - Large icon (64px) representing the feature
2. **Title** - Clear, concise title (e.g., "No Items Yet")
3. **Description** - Optional helpful text
4. **Action** - Optional primary action button

### Empty State Examples

**Shopping Lists:**

```typescript
<EmptyState
  icon="cart-outline"
  title="No Items Yet"
  description="Start adding items to your shopping list"
  actionLabel="Add First Item"
  onActionPress={handleAdd}
  iconColor={colors.shopping}
  actionColor={colors.shopping}
/>
```

**Recipes:**

```typescript
<EmptyState
  icon="restaurant-outline"
  title="No Recipes Yet"
  description="Save your favorite recipes here"
  actionLabel="Add Recipe"
  onActionPress={handleAdd}
  iconColor={colors.recipes}
  actionColor={colors.recipes}
/>
```

**Chores:**

```typescript
<EmptyState
  icon="checkmark-circle-outline"
  title="No Chores Yet"
  description="Add chores to keep your household organized"
  actionLabel="Add Chore"
  onActionPress={handleAdd}
  iconColor={colors.chores}
  actionColor={colors.chores}
/>
```

### Empty State Best Practices

1. **Use section-specific colors** for icons and actions
2. **Keep titles short** (2-4 words)
3. **Make descriptions helpful** - suggest what to do
4. **Always provide an action** if the user can add content
5. **Use appropriate icons** from Ionicons that match the feature

---

## Best Practices

### Importing Theme Values

Always import from the centralized theme:

```typescript
// ✅ Correct
import { colors, spacing, typography } from '../../../theme';

// ❌ Avoid
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
```

### Using Typography

Spread typography styles into Text components:

```typescript
// ✅ Correct
<Text style={typography.h2}>Heading</Text>
<Text style={[typography.body, { color: colors.textSecondary }]}>
  Body text
</Text>

// ❌ Avoid hardcoding
<Text style={{ fontSize: 24, fontWeight: '600' }}>Heading</Text>
```

### Using Spacing

Use spacing constants for all layout values:

```typescript
// ✅ Correct
const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});

// ❌ Avoid magic numbers
const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
});
```

### Using Colors

Use semantic color names:

```typescript
// ✅ Correct
backgroundColor: colors.primary
color: colors.textSecondary

// ❌ Avoid hex values
backgroundColor: '#606c38'
color: '#6B7280'
```

### Component Structure

Follow the established component structure:

```
ComponentName/
├── ComponentName.tsx    # Component logic
├── styles.ts            # StyleSheet definitions
├── types.ts             # TypeScript types
└── index.ts             # Barrel export
```

### Accessibility

Always include accessibility props:

```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add new item"
  accessibilityState={{ disabled: isDisabled }}
  onPress={handlePress}
>
  {/* ... */}
</TouchableOpacity>
```

### Animation Performance

1. **Use `react-native-reanimated`** for complex animations
2. **Always set `useNativeDriver: true`** for Animated API (when possible)
3. **Avoid animating layout properties** (use transforms instead)
4. **Use `worklet` directive** for reanimated functions

### Modal Patterns

1. **Use CenteredModal** for forms and data entry
2. **Use ConfirmationModal** for destructive actions
3. **Set appropriate `confirmColor`** based on context:
   - Feature actions: `colors.shopping`, `colors.recipes`, etc.
   - Destructive actions: `colors.error`
   - Default actions: `colors.primary`

### Loading States

1. **Prefer skeleton loaders** over spinners
2. **Match skeleton structure** to content
3. **Show realistic content quantity** (3-4 items for lists)

### Empty States

1. **Always provide an empty state** when a list can be empty
2. **Use EmptyState component** for consistency
3. **Make empty states actionable** with a primary action
4. **Use section-specific colors** for cohesion

---

## Quick Reference

### Common Patterns

**Card with shadow:**

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    ...shadows.md,
  },
});
```

**Section header:**

```typescript
<Text style={typography.sectionTitle}>SECTION NAME</Text>
```

**Button:**

```typescript
<TouchableOpacity
  style={{
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  }}
  onPress={handlePress}
>
  <Text style={[typography.button, { color: colors.textLight }]}>
    Button Text
  </Text>
</TouchableOpacity>
```

**List item:**

```typescript
<ListItemCardWrapper onPress={handlePress}>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
    <Ionicons name="cart-outline" size={iconSize.md} color={colors.primary} />
    <View style={{ flex: 1 }}>
      <Text style={typography.body}>Item Name</Text>
      <Text style={typography.caption}>Subtitle</Text>
    </View>
  </View>
</ListItemCardWrapper>
```

---

## Resources

- **Component Library:** `/mobile/src/common/components/`
- **Theme Files:** `/mobile/src/theme/`
- **Feature Examples:** `/mobile/src/features/*/screens/`
- **Icon Library:** [Ionicons](https://ionic.io/ionicons)

---

**Last Updated:** February 11, 2026
**Maintained by:** Kitchen Hub Development Team
