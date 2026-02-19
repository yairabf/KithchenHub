import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme';
import { styles } from './styles';
import { ListItemCardWrapperProps } from './types';

/**
 * Reusable card wrapper that provides consistent styling for list items across the app.
 * Can be used for shopping items, chores, recipe ingredients, and grid items.
 *
 * Provides:
 * - Standard padding (md + xs)
 * - Standard border radius (xxl)
 * - Standard border and shadow
 * - Customizable background color
 * - Optional press handling
 */
export const ListItemCardWrapper: React.FC<ListItemCardWrapperProps> = ({
    children,
    backgroundColor = colors.surface,
    style,
    onPress,
    testID,
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint,
}) => {
    const containerStyle = [
        styles.wrapper,
        { backgroundColor },
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                style={containerStyle}
                onPress={onPress}
                activeOpacity={0.7}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole={accessibilityRole}
                accessibilityHint={accessibilityHint}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View
            style={containerStyle}
            testID={testID}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={accessibilityRole}
            accessibilityHint={accessibilityHint}
        >
            {children}
        </View>
    );
};
