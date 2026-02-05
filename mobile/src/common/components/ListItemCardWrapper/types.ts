import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface ListItemCardWrapperProps {
    /** Content to render inside the card */
    children: ReactNode;

    /**
     * Background color of the card
     * @default colors.surface
     */
    backgroundColor?: string;

    /** Optional style override (single style or array) */
    style?: StyleProp<ViewStyle>;

    /** Optional press handler. When provided, component renders as TouchableOpacity */
    onPress?: () => void;

    /** Test ID for testing */
    testID?: string;
}
