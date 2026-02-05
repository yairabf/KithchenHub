/**
 * Default Shopping List Constants
 *
 * Defines default values for shopping lists created during household setup.
 * These constants ensure consistency across the application.
 *
 * Icon System: Uses Ionicons icon names (@expo/vector-icons)
 * @see https://icons.expo.fyi/Index for available icon names
 */

/**
 * Default main shopping list configuration
 * Created automatically when a new household is established
 */
export const DEFAULT_MAIN_SHOPPING_LIST = {
  /**
   * Default name for the main shopping list
   */
  NAME: 'Weekly Shopping',
  /**
   * Default color (Material Design Green 500 - #4CAF50)
   * Hex color code for consistent theming across mobile and web
   */
  COLOR: '#4CAF50',
  /**
   * Default icon name from Ionicons library
   * 'cart-outline' represents a shopping cart icon
   * Must match valid Ionicons names used in React Native/Expo
   */
  ICON: 'cart-outline',
} as const;
