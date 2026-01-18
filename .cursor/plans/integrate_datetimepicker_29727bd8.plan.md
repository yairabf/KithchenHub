---
name: Integrate DateTimePicker
overview: Replace existing date-only pickers with the new DateTimePicker component in both the add chore (ChoresQuickActionModal) and edit chore (ChoreDetailsModal) modals to enable full date and time selection.
todos:
  - id: update-quick-action-modal
    content: Replace date picker in ChoresQuickActionModal with DateTimePicker
    status: completed
  - id: update-details-modal
    content: Add DateTimePicker to ChoreDetailsModal for editing date/time
    status: completed
  - id: test-add-flow
    content: Test adding new chores with date/time selection
    status: completed
    dependencies:
      - update-quick-action-modal
  - id: test-edit-flow
    content: Test editing existing chores' date/time
    status: completed
    dependencies:
      - update-details-modal
---

# Integrate DateTimePicker Component into Chores

## Changes Overview

Replace the existing date-only picker implementations with the new DateTimePicker component that supports both date and time selection across all platforms.

## Files to Modify

### 1. [src/components/modals/ChoresQuickActionModal.tsx](src/components/modals/ChoresQuickActionModal.tsx)

**Current implementation:**

- Uses `react-native-paper-dates` DatePickerModal (date only)
- State: `selectedDate` as dayjs object
- Custom date formatting logic
- No time selection

**Changes:**

- Import DateTimePicker component
- Replace `selectedDate` state (dayjs) with `selectedDateTime` state (Date | null)
- Remove `showDatePicker`, `pickerDate` states
- Remove DatePickerModal import and component
- Replace date picker button and modal with DateTimePicker component
- Update `handleAddChore` to use Date object instead of dayjs
- Remove custom `formatDate` function (DateTimePicker handles formatting)
- Remove date picker web styles injection code (lines 24-79)
- Remove `react-native-paper-dates` imports

**DateTimePicker configuration:**

```tsx
<DateTimePicker
  value={selectedDateTime}
  onChange={setSelectedDateTime}
  label="Due Date & Time"
  placeholder="Select date and time..."
  minDate={new Date()}
  accentColor={colors.chores}
  displayFormat="MMM D, YYYY h:mm A"
/>
```

### 2. [src/components/modals/ChoreDetailsModal.tsx](src/components/modals/ChoreDetailsModal.tsx)

**Current implementation:**

- Displays date/time as read-only text (line 87-89)
- No editing capability for date/time
- Chore interface has `dueDate` (string) and `dueTime` (string) separately

**Changes:**

- Import DateTimePicker component
- Add state: `selectedDateTime` (Date | null) initialized from chore's dueDate/dueTime
- Parse existing `chore.dueDate` and `chore.dueTime` strings into Date object on mount
- Replace static text display with DateTimePicker component
- Update `handleSave` to format Date back to string format for the chore object
- Add date/time to the `onUpdateChore` callback

**DateTimePicker configuration:**

```tsx
<DateTimePicker
  value={selectedDateTime}
  onChange={setSelectedDateTime}
  label="Due Date & Time"
  minDate={new Date()}
  accentColor={colors.chores}
  displayFormat="MMM D, YYYY h:mm A"
/>
```

## Data Flow Considerations

### Add Chore Flow

1. User selects date/time via DateTimePicker → returns Date object
2. On save, convert Date to ISO string for backend/state storage
3. Calculate section ('today' vs 'thisWeek') from Date object

### Edit Chore Flow

1. Parse chore's string `dueDate` + `dueTime` into Date object
2. User edits via DateTimePicker → returns new Date object
3. On save, format Date back to string format for chore update
4. May need helper function to parse "Today", "Tomorrow", "Wednesday" + "6:00 PM" format

## Benefits

- Unified date AND time selection (currently only date)
- Consistent UX across add and edit flows
- Cross-platform support (iOS, Android, Web)
- Better accessibility
- Cleaner code (removes custom date picker logic)