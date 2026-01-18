---
name: Convert to CenteredModal
overview: Refactor ManageHouseholdModal from bottom sheet design to use the CenteredModal component, wrapping all existing content (add form, member list, footer) inside it with showActions=false.
todos:
  - id: refactor-modal
    content: Refactor ManageHouseholdModal to use CenteredModal component
    status: completed
  - id: test-functionality
    content: Test add/remove member functionality and scrolling behavior
    status: completed
    dependencies:
      - refactor-modal
---

# Convert ManageHouseholdModal to CenteredModal

## Overview

Refactor the [`ManageHouseholdModal`](src/components/modals/ManageHouseholdModal.tsx) to use the shared [`CenteredModal`](src/components/common/CenteredModal.tsx) component instead of its current bottom sheet implementation.

## Changes Required

### 1. Update ManageHouseholdModal Component

**File:** [`src/components/modals/ManageHouseholdModal.tsx`](src/components/modals/ManageHouseholdModal.tsx)

- **Remove** bottom sheet animation logic (translateY, SCREEN_HEIGHT calculations)
- **Remove** custom Modal, backdrop, and animation code
- **Import** CenteredModal component
- **Wrap** existing content (add member form, members list, footer) inside CenteredModal
- **Configure** CenteredModal with:
- `showActions={false}` (no Cancel/Confirm buttons needed)
- `title="Manage Household"`
- Pass through `visible` and `onClose` props
- **Keep** all existing functionality:
- Add member form with TextInput and add button
- Scrollable members list with color dots and delete buttons
- Default member badges and disabled delete for defaults
- Footer text about default members
- **Remove** custom header since CenteredModal provides one
- **Adjust** styling to work within centered modal (remove bottom sheet specific styles)
- **Handle** ScrollView height constraints within the modal

### 2. Style Adjustments

- Remove bottom sheet styles (keyboardView, modalContainer with borderTopRadius)
- Adjust content padding to work within CenteredModal's padding
- Ensure ScrollView has proper maxHeight to fit within modal
- Keep all member row, form, and badge styling intact

## Technical Notes

- CenteredModal already handles backdrop, animations (fade + scale), and close button
- The existing add member form and list functionality remains unchanged
- KeyboardAvoidingView may need adjustment since CenteredModal is centered, not bottom-aligned
- The modal will now appear centered with fade/scale animation instead of sliding from bottom