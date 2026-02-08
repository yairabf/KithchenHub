/** boxShadow value (React Native New Architecture); avoids deprecated shadow* props */
type BoxShadowValue = {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
  spreadDistance?: number;
  inset?: boolean;
};

type ShadowStyle = {
  boxShadow?: BoxShadowValue;
  elevation?: number;
};

export const shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'float' | 'deep', ShadowStyle> = {
  none: {
    boxShadow: { offsetX: 0, offsetY: 0, blurRadius: 0, color: 'transparent' },
    elevation: 0,
  },
  sm: {
    boxShadow: { offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(40, 54, 24, 0.08)' },
    elevation: 2,
  },
  md: {
    boxShadow: { offsetX: 0, offsetY: 4, blurRadius: 8, color: 'rgba(40, 54, 24, 0.12)' },
    elevation: 4,
  },
  lg: {
    boxShadow: { offsetX: 0, offsetY: 6, blurRadius: 12, color: 'rgba(40, 54, 24, 0.16)' },
    elevation: 6,
  },
  xl: {
    boxShadow: { offsetX: 0, offsetY: 8, blurRadius: 16, color: 'rgba(40, 54, 24, 0.2)' },
    elevation: 10,
  },
  float: {
    boxShadow: { offsetX: 0, offsetY: 8, blurRadius: 20, color: 'rgba(40, 54, 24, 0.18)' },
    elevation: 12,
  },
  deep: {
    boxShadow: { offsetX: 0, offsetY: 12, blurRadius: 24, color: 'rgba(40, 54, 24, 0.25)' },
    elevation: 16,
  },
};

/** Build a boxShadow style (avoids deprecated shadow* props). */
export function boxShadow(
  offsetY: number,
  blurRadius: number,
  color: string,
  offsetX = 0
): ShadowStyle {
  return {
    boxShadow: { offsetX, offsetY, blurRadius, color },
    elevation: Math.min(blurRadius, 16),
  };
}
