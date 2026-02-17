import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  styles,
  DROPDOWN_MAX_HEIGHT,
  DROPDOWN_SPACING,
  DROPDOWN_FALLBACK_WIDTH,
} from './styles';
import { normalizeCategoryKey } from '../../constants/categories';
import { getCategoryImageSource } from '../../utils/categoryImage';

const createPortal =
  typeof document !== 'undefined' && typeof document.body !== 'undefined'
    ? require('react-dom').createPortal
    : null;

export interface CategoryPickerProps {
  /** Currently selected category ID */
  selectedCategory: string;
  /** Callback when category is selected */
  onSelectCategory: (category: string) => void;
  /** Array of available category IDs */
  categories: string[];
}

const PORTAL_Z_INDEX = 100000;

/** Timeout delay before initial trigger measurement (ms) */
const MEASUREMENT_DELAY_MS = 100;

/**
 * Interface for a React Native View that supports measureInWindow.
 * Used to safely type-check and access the measureInWindow method.
 */
interface MeasurableView {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

/**
 * Type guard to check if a ref contains a View with measureInWindow method.
 */
function isMeasurableView(ref: unknown): ref is MeasurableView {
  return (
    ref !== null &&
    typeof ref === 'object' &&
    'measureInWindow' in ref &&
    typeof (ref as MeasurableView).measureInWindow === 'function'
  );
}

/**
 * Portal layout coordinates for positioning dropdown.
 */
interface PortalLayout {
  top: number;
  left: number;
  width: number;
}

/**
 * Measures the trigger element's viewport position and dimensions.
 * Used to position the portal-rendered dropdown correctly on web.
 *
 * @param ref - React ref to the trigger View (may be null)
 * @param onMeasure - Callback with layout coordinates
 */
function measureTriggerElement(
  ref: React.RefObject<View | null>,
  onMeasure: (layout: PortalLayout) => void,
): void {
  const node = ref.current;
  if (!isMeasurableView(node)) {
    // Fallback layout for testing or when measure is unavailable
    onMeasure({
      top: 0,
      left: 0,
      width: DROPDOWN_FALLBACK_WIDTH,
    });
    return;
  }

  node.measureInWindow((x, y, width, height) => {
    onMeasure({
      top: y + height + DROPDOWN_SPACING,
      left: x,
      width,
    });
  });
}

/**
 * CategoryPicker Component
 *
 * Dropdown that shows the selected category and opens a list to pick another.
 *
 * **Portal Rendering (Web)**:
 * On web platforms, the dropdown is rendered using ReactDOM.createPortal with position:fixed
 * and high z-index to ensure it appears above modals and other overlays. The trigger element
 * is measured using measureInWindow to position the portal dropdown correctly.
 *
 * **In-Place Rendering (Native)**:
 * On native platforms, the dropdown is rendered in-place within the component tree with
 * absolute positioning. Pre-rendering with opacity:0 ensures smooth animations without
 * flicker when opening.
 */
export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
  categories,
}: CategoryPickerProps) {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [portalLayout, setPortalLayout] = useState<PortalLayout | null>(null);
  const triggerRef = useRef<View>(null);

  /**
   * Initial measurement of trigger position on mount (web only).
   * Delayed slightly to ensure layout is complete.
   */
  useEffect(() => {
    if (!createPortal || !triggerRef.current) return;

    const timeoutId = setTimeout(() => {
      measureTriggerElement(triggerRef, setPortalLayout);
    }, MEASUREMENT_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [createPortal]);

  /**
   * Handles opening/closing the dropdown.
   * On web, measures trigger position before opening.
   */
  const handleTriggerPress = useCallback(() => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      return;
    }

    if (createPortal) {
      // Measure trigger position before opening portal dropdown
      measureTriggerElement(triggerRef, (layout) => {
        setPortalLayout(layout);
        setDropdownOpen(true);
      });
    } else {
      // Native: just toggle dropdown
      setDropdownOpen(true);
    }
  }, [dropdownOpen]);

  /**
   * Gets the translated category name.
   * Falls back to category ID if translation fails or is unavailable.
   */
  const getCategoryName = useCallback(
    (categoryId: string): string => {
      try {
        return t(`categories:${categoryId}`, { defaultValue: categoryId });
      } catch (error) {
        // Log translation errors in development
        if (__DEV__) {
          console.warn(
            `[CategoryPicker] Translation failed for category: ${categoryId}`,
            error,
          );
        }
        return categoryId;
      }
    },
    [t],
  );

  const uniqueCategories = Array.from(
    new Set(categories.map((cat) => normalizeCategoryKey(cat))),
  );
  const normalizedSelected = normalizeCategoryKey(selectedCategory);
  const selectedName = getCategoryName(normalizedSelected);
  const selectedIcon = getCategoryImageSource(normalizedSelected);

  const handleSelect = useCallback(
    (categoryId: string) => {
      onSelectCategory(categoryId);
      setDropdownOpen(false);
    },
    [onSelectCategory],
  );

  const usePortal = Boolean(createPortal && portalLayout && dropdownOpen);

  const dropdownContent = (
    <View
      style={[
        styles.dropdown,
        !usePortal && styles.dropdownInPlace,
        usePortal && styles.dropdownPortal,
        usePortal && portalLayout && {
          width: portalLayout.width,
        },
      ]}
      testID="category-picker-dropdown"
    >
      <ScrollView
        style={[styles.dropdownScroll, { maxHeight: DROPDOWN_MAX_HEIGHT }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {uniqueCategories.map((categoryId) => {
          const isSelected =
            normalizeCategoryKey(categoryId) === normalizedSelected;
          const iconSource = getCategoryImageSource(categoryId);
          const categoryName = getCategoryName(categoryId);

          return (
            <TouchableOpacity
              key={categoryId}
              style={[
                styles.dropdownItem,
                isSelected && styles.dropdownItemSelected,
              ]}
              onPress={() => handleSelect(categoryId)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={categoryName}
              accessibilityState={{ selected: isSelected }}
            >
              {iconSource ? (
                <Image
                  source={iconSource}
                  style={styles.dropdownItemIcon}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.dropdownItemIconPlaceholder}>
                  <Text style={styles.dropdownItemIconText}>
                    {categoryName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.dropdownItemText,
                  isSelected && styles.dropdownItemTextSelected,
                ]}
                numberOfLines={1}
              >
                {categoryName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          style={[styles.trigger, dropdownOpen && styles.triggerOpen]}
          onPress={handleTriggerPress}
          accessibilityRole="button"
          accessibilityLabel={`Category: ${selectedName}. Tap to change.`}
          accessibilityState={{ expanded: dropdownOpen }}
          accessibilityHint="Opens category list"
          testID="category-picker-trigger"
        >
          <View style={styles.triggerContent}>
            {selectedIcon ? (
              <Image
                source={selectedIcon}
                style={styles.triggerIcon}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.triggerIconPlaceholder}>
                <Text style={styles.triggerIconText}>
                  {selectedName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.triggerText} numberOfLines={1}>
              {selectedName}
            </Text>
          </View>
          <Ionicons
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            style={styles.triggerChevron}
          />
        </Pressable>
      </View>

      {/* Native/Test: In-place dropdown with pre-rendering */}
      {!usePortal && (
        <View
          style={[
            styles.dropdownWrapper,
            !dropdownOpen && styles.dropdownWrapperHidden,
          ]}
          pointerEvents={dropdownOpen ? 'auto' : 'none'}
        >
          {dropdownContent}
        </View>
      )}

      {/* Web: Portal-rendered dropdown for correct z-index stacking */}
      {createPortal &&
        portalLayout &&
        createPortal(
          React.createElement(
            'div',
            {
              style: {
                position: 'fixed',
                top: portalLayout.top,
                left: portalLayout.left,
                width: portalLayout.width,
                zIndex: PORTAL_Z_INDEX,
                visibility: dropdownOpen ? 'visible' : 'hidden',
                opacity: dropdownOpen ? 1 : 0,
                pointerEvents: dropdownOpen ? 'auto' : 'none',
              },
            },
            dropdownContent,
          ),
          document.body,
          'category-picker-portal',
        )}
    </View>
  );
}
