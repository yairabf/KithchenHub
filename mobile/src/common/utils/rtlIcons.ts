/**
 * RTL-aware directional icon mapping.
 * In RTL layout, horizontal arrows/chevrons should flip so "forward" stays toward reading direction.
 */
import { I18nManager } from 'react-native';

/** Icon names that are flipped in RTL (horizontal direction). Use with Ionicons. */
export type DirectionalIconName =
  | 'chevron-forward'
  | 'chevron-back'
  | 'arrow-forward'
  | 'arrow-back';

/** LTR icon name → RTL icon name (flipped for RTL). */
const RTL_ICON_MAP: Record<DirectionalIconName, DirectionalIconName> = {
  'chevron-forward': 'chevron-back',
  'chevron-back': 'chevron-forward',
  'arrow-forward': 'arrow-back',
  'arrow-back': 'arrow-forward',
};

/**
 * Returns the icon name appropriate for the current layout direction.
 * In RTL, horizontal directional icons are flipped; in LTR the LTR name is returned as-is.
 * Use DirectionalIconName for type-safe use with Ionicons.
 *
 * @param ltrIconName - Icon name as used in LTR (e.g. 'arrow-back', 'chevron-forward')
 * @returns Icon name for current direction (flipped in RTL when mapped)
 */
export function getDirectionalIcon(ltrIconName: DirectionalIconName): DirectionalIconName;
export function getDirectionalIcon(ltrIconName: string): string;
export function getDirectionalIcon(ltrIconName: string): string {
  if (!I18nManager.isRTL) {
    return ltrIconName;
  }
  const rtlName = RTL_ICON_MAP[ltrIconName as DirectionalIconName];
  return rtlName ?? ltrIconName;
}
