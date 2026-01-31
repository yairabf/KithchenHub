/**
 * Jest manual mock for @expo/vector-icons.
 * Avoids loading expo-modules-core/EventEmitter in tests, which fails in the Jest environment.
 * Exports a minimal icon component for all icon sets used by the app (e.g. Ionicons).
 */
const React = require('react');
const { View } = require('react-native');

/** Minimal icon component for Jest; renders a View to avoid loading expo-modules-core. */
const MockIcon = (props) =>
  React.createElement(View, {
    ...props,
    testID: 'mock-icon',
    accessibilityLabel: props.name ?? 'icon',
  });

module.exports = {
  default: MockIcon,
  Ionicons: MockIcon,
  MaterialCommunityIcons: MockIcon,
  MaterialIcons: MockIcon,
  FontAwesome: MockIcon,
  FontAwesome5: MockIcon,
  FontAwesome6: MockIcon,
  Feather: MockIcon,
  AntDesign: MockIcon,
  Entypo: MockIcon,
  EvilIcons: MockIcon,
  Foundation: MockIcon,
  Octicons: MockIcon,
  SimpleLineIcons: MockIcon,
  Zocial: MockIcon,
  Fontisto: MockIcon,
};
