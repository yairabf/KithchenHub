import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  TABLET: 768,
  SMALL_PHONE: 375,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isTablet: width >= BREAKPOINTS.TABLET,
    isPhone: width < BREAKPOINTS.TABLET,
    isSmallPhone: width < BREAKPOINTS.SMALL_PHONE,
    isLandscape: width > height,
  };
}
