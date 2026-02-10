/** boxShadow value (React Native New Architecture); avoids deprecated shadow* props */
export type BoxShadowValue = {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
  spreadDistance?: number;
  inset?: boolean;
};

export type ShadowStyle = {
  boxShadow?: string | readonly BoxShadowValue[];
  elevation?: number;
};

export const shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'float' | 'deep', ShadowStyle> = {
  none: {
    boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, color: 'transparent' }],
    elevation: 0,
  },
  sm: {
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(15, 23, 42, 0.05)' }],
    elevation: 2,
  },
  md: {
    boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: 'rgba(15, 23, 42, 0.08)' }],
    elevation: 4,
  },
  lg: {
    boxShadow: [{ offsetX: 0, offsetY: 10, blurRadius: 40, color: 'rgba(15, 23, 42, 0.1)' }],
    elevation: 8,
  },
  xl: {
    boxShadow: [{ offsetX: 0, offsetY: 20, blurRadius: 25, color: 'rgba(15, 23, 42, 0.05)' }],
    elevation: 12,
  },
  float: {
    boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 20, color: 'rgba(15, 23, 42, 0.12)' }],
    elevation: 12,
  },
  deep: {
    boxShadow: [{ offsetX: 0, offsetY: 12, blurRadius: 24, color: 'rgba(15, 23, 42, 0.2)' }],
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
    boxShadow: [{ offsetX, offsetY, blurRadius, color }],
    elevation: Math.min(blurRadius, 16),
  };
}
