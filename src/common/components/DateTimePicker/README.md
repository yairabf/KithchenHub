# DateTimePicker Component

A cross-platform date and time picker component for React Native/Expo that supports iOS, Android, and Web.

## Installation

The component uses dependencies that are already installed in the project:
- `@react-native-community/datetimepicker` - Native pickers for iOS/Android
- `react-native-paper-dates` - Calendar for web
- `dayjs` - Date formatting

## Basic Usage

```tsx
import { DateTimePicker } from '../components/common/DateTimePicker';
import { useState } from 'react';

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <DateTimePicker
      value={selectedDate}
      onChange={setSelectedDate}
      label="Due Date"
      placeholder="Select date and time..."
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date \| null` | **required** | The currently selected date/time |
| `onChange` | `(date: Date) => void` | **required** | Callback when date/time is confirmed |
| `label` | `string` | `undefined` | Label displayed above the picker button |
| `placeholder` | `string` | `"Select date & time"` | Text shown when no date is selected |
| `minDate` | `Date` | `undefined` | Minimum selectable date |
| `maxDate` | `Date` | `undefined` | Maximum selectable date |
| `accentColor` | `string` | `colors.primary` | Accent color for highlights and icons |
| `disabled` | `boolean` | `false` | Disables the picker |
| `displayFormat` | `string` | `"MMM D, YYYY h:mm A"` | Date format string (dayjs format) |
| `timeFormat` | `"12h" \| "24h"` | `"12h"` | 12-hour or 24-hour time format |
| `minuteInterval` | `1 \| 5 \| 10 \| 15 \| 30` | `1` | Interval for minute selection |

## Examples

### Basic Date/Time Selection

```tsx
<DateTimePicker
  value={dateTime}
  onChange={setDateTime}
/>
```

### With Label and Placeholder

```tsx
<DateTimePicker
  value={appointmentTime}
  onChange={setAppointmentTime}
  label="Appointment"
  placeholder="When would you like to schedule?"
/>
```

### With Date Constraints

```tsx
// Only allow future dates
<DateTimePicker
  value={dueDate}
  onChange={setDueDate}
  label="Due Date"
  minDate={new Date()}
/>

// Date range constraint
<DateTimePicker
  value={eventDate}
  onChange={setEventDate}
  minDate={new Date()}
  maxDate={new Date(2025, 11, 31)}
/>
```

### Custom Accent Color

```tsx
import { colors } from '../../../theme';

// Match the chores section color
<DateTimePicker
  value={choreDeadline}
  onChange={setChoreDeadline}
  label="Chore Deadline"
  accentColor={colors.chores}
/>

// Match the shopping section color
<DateTimePicker
  value={shoppingDate}
  onChange={setShoppingDate}
  accentColor={colors.shopping}
/>
```

### 24-Hour Time Format

```tsx
<DateTimePicker
  value={meetingTime}
  onChange={setMeetingTime}
  timeFormat="24h"
  displayFormat="MMM D, YYYY HH:mm"
/>
```

### Minute Intervals

```tsx
// 15-minute intervals (common for appointments)
<DateTimePicker
  value={appointmentTime}
  onChange={setAppointmentTime}
  minuteInterval={15}
/>

// 30-minute intervals
<DateTimePicker
  value={meetingTime}
  onChange={setMeetingTime}
  minuteInterval={30}
/>
```

### Custom Display Format

```tsx
// Short format
<DateTimePicker
  value={date}
  onChange={setDate}
  displayFormat="MM/DD/YY h:mm A"
/>

// Verbose format
<DateTimePicker
  value={date}
  onChange={setDate}
  displayFormat="dddd, MMMM D, YYYY [at] h:mm A"
/>
```

### Disabled State

```tsx
<DateTimePicker
  value={lockedDate}
  onChange={setLockedDate}
  disabled={!canEdit}
/>
```

## Display Format Tokens

The `displayFormat` prop uses dayjs format tokens:

| Token | Example | Description |
|-------|---------|-------------|
| `YYYY` | 2024 | 4-digit year |
| `YY` | 24 | 2-digit year |
| `MMMM` | January | Full month name |
| `MMM` | Jan | Abbreviated month |
| `MM` | 01 | 2-digit month |
| `M` | 1 | Month number |
| `DD` | 05 | 2-digit day |
| `D` | 5 | Day number |
| `dddd` | Monday | Full weekday name |
| `ddd` | Mon | Abbreviated weekday |
| `HH` | 13 | 24-hour (2-digit) |
| `H` | 13 | 24-hour |
| `hh` | 01 | 12-hour (2-digit) |
| `h` | 1 | 12-hour |
| `mm` | 05 | Minutes (2-digit) |
| `A` | PM | AM/PM uppercase |
| `a` | pm | am/pm lowercase |

## Platform Behavior

### iOS
- Uses native spinner-style picker
- Separate tabs for Date and Time selection
- Native feel with smooth scrolling

### Android
- Shows "Change Date" and "Change Time" buttons
- Opens native Material Design dialogs
- Date and time are selected sequentially

### Web
- Uses `react-native-paper-dates` calendar for date selection
- Custom scrollable wheel picker for time selection
- AM/PM toggle buttons for 12-hour format

## Accessibility

The component includes full accessibility support:
- Proper `accessibilityRole` on all interactive elements
- Descriptive `accessibilityLabel` for screen readers
- `accessibilityState` for disabled and selected states
- `accessibilityHint` to explain button actions

## Integration with Forms

```tsx
function ChoreForm() {
  const [choreName, setChoreName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignee, setAssignee] = useState('');

  const handleSubmit = () => {
    if (!choreName || !dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    createChore({
      name: choreName,
      dueDate: dueDate.toISOString(),
      assignee,
    });
  };

  return (
    <View>
      <TextInput
        value={choreName}
        onChangeText={setChoreName}
        placeholder="Chore name"
      />

      <DateTimePicker
        value={dueDate}
        onChange={setDueDate}
        label="Due Date & Time"
        minDate={new Date()}
        accentColor={colors.chores}
      />

      <Button title="Create Chore" onPress={handleSubmit} />
    </View>
  );
}
```

## TypeScript

The component exports its props type for use in wrapper components:

```tsx
import { DateTimePicker, DateTimePickerProps } from '../components/common/DateTimePicker';

interface MyDateFieldProps extends Omit<DateTimePickerProps, 'onChange'> {
  onDateChange: (date: Date) => void;
  error?: string;
}

function MyDateField({ onDateChange, error, ...props }: MyDateFieldProps) {
  return (
    <View>
      <DateTimePicker {...props} onChange={onDateChange} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```
