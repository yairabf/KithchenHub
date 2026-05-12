import type { ReactNode } from 'react';
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

/**
 * Props for the base GroceryCard component
 * Provides consistent card styling across all contexts
 */
export interface GroceryCardProps {
  /** Optional background color for the card (e.g., pastel colors for ingredients) */
  backgroundColor?: string;

  /** Child elements to render inside the card */
  children: ReactNode;

  /** Optional custom styles to apply to the card container */
  style?: ViewStyle;

  /** Optional test ID for automated testing */
  testID?: string;
}

/**
 * Minimal item shape for the shared wrapper-free grocery row content.
 * Keep this data-focused so shopping rows and recipe ingredient rows can reuse
 * the same inner element while choosing their own outer wrapper/actions.
 */
export interface GroceryItemContentItem {
  name: string;
  image?: string;
  category?: string;
}

/**
 * Props for the shared wrapper-free grocery item content component.
 */
export interface GroceryItemContentProps {
  item: GroceryItemContentItem;
  imageTestID?: string;
  imageStyle?: StyleProp<ImageStyle>;
  categoryFallbackTestID?: string;
  categoryFallbackImageStyle?: StyleProp<ImageStyle>;
  fallbackIcon?: ReactNode;
  iconContainerStyle?: StyleProp<ViewStyle>;
  titleStyle?: TextStyle;
  subtitle?: string | ReactNode;
  rightElement?: ReactNode;
  imagePosition?: 'left' | 'none';
  onPress?: () => void;
  isRtl?: boolean;
}

/**
 * Props for the flexible GroceryCardContent layout component
 * Handles all layout variations (image/no-image, different right actions)
 */
export interface GroceryCardContentProps {
  /** Optional image URL to display on the left side. Must be a valid HTTP/HTTPS URL. */
  image?: string;

  /** Optional test ID forwarded to the image/fallback thumbnail slot. */
  imageTestID?: string;

  /** Optional custom style for the image thumbnail. */
  imageStyle?: StyleProp<ImageStyle>;

  /**
   * Custom icon element to display if no image is provided.
   * Useful for placeholder icons or custom graphics.
   */
  customIcon?: ReactNode;

  /** Optional custom style for the no-image icon thumbnail slot. */
  iconContainerStyle?: StyleProp<ViewStyle>;

  /** Main title text displayed prominently (required) */
  title: string;

  /** Optional custom styles for the title text */
  titleStyle?: TextStyle;

  /**
   * Subtitle text or custom React element displayed below the title.
   * Can be a string (e.g., category name) or a component (e.g., IngredientInfo).
   */
  subtitle?: string | ReactNode;

  /**
   * Custom element rendered on the right side of the card.
   * Common examples: action buttons, quantity controls, icons.
   */
  rightElement?: ReactNode;

  /**
   * Position of the image.
   * - 'left': Display image on the left side (default)
   * - 'none': Hide image area entirely
   */
  imagePosition?: 'left' | 'none';

  /**
   * If provided, wraps the entire content in a TouchableOpacity with this callback.
   * Makes the card tappable for navigation or selection.
   */
  onPress?: () => void;

  /** Force RTL/LTR layout for content alignment. Defaults to device RTL setting. */
  isRtl?: boolean;
}

/**
 * Props for QuantityControls component (shopping context)
 * Standalone +/- quantity controls for adjusting item quantities
 */
export interface QuantityControlsProps {
  /** Current quantity value to display */
  quantity: number;

  /** Callback invoked when the + button is pressed */
  onIncrement: () => void;

  /** Callback invoked when the - button is pressed */
  onDecrement: () => void;

  /**
   * Minimum allowed quantity. The decrement button is disabled when quantity equals this value.
   * @default 1
   */
  minQuantity?: number;
}

/**
 * Props for IngredientInfo component (recipe context)
 * Displays formatted quantity + unit for recipe ingredients
 */
export interface IngredientInfoProps {
  /**
   * Quantity as a string (e.g., "2", "0.5", "1.5").
   * Will be formatted to remove unnecessary decimals.
   */
  quantity: string;

  /**
   * Unit of measurement (e.g., "cups", "tsp", "g", "pcs").
   * Displayed in uppercase alongside the quantity.
   */
  unit: string;
}
