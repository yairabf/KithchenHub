import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { isValidImageUrl } from '../../../../common/utils/imageUtils';
import { styles } from './styles';
import { Category } from './types';

/**
 * Props for CategoriesGridItem component.
 * Displays a single category tile with an icon/image positioned top-right
 * and the category name at the bottom-left.
 */
interface CategoriesGridItemProps {
    /** Category data including id, name, itemCount, and optional remote image URL */
    category: Category;
    
    /** Callback fired when user taps the category tile */
    onPress: () => void;
    
    /** 
     * Local category icon from assets. Null if category has no local icon.
     * Takes precedence over category.image if both are present.
     * @example require('../../../../../assets/categories/fruits.png')
     */
    categoryIcon: ReturnType<typeof require> | null;
}

export const CategoriesGridItem: React.FC<CategoriesGridItemProps> = ({
    category,
    onPress,
    categoryIcon
}) => {
    const { width } = useWindowDimensions();
    const hasImage = isValidImageUrl(category.image);
    const hasIcon = categoryIcon !== null;

    /**
     * Calculate responsive sizes based on screen width
     * Optimized for phone screens (320-428px) and tablets (768px+)
     */
    const responsiveSizes = useMemo(() => {
        // Calculate actual tile width (31% of screen width minus padding)
        const horizontalPadding = 48; // 24px on each side
        const gaps = 16; // Two 8px gaps for three tiles
        const availableWidth = width - horizontalPadding - gaps;
        const tileWidth = availableWidth * 0.31;
        
        // Icon size: 60-70% of tile width (min 48px, max 100px)
        const iconSize = Math.min(Math.max(tileWidth * 0.65, 48), 100);
        
        /**
         * Font size: optimized for phone readability
         * - Phone (320-428px): 13-14px
         * - Tablet (768px+): 16-18px
         * Uses tile width for better accuracy than screen width
         */
        let fontSize: number;
        if (tileWidth < 100) {
            // Small phones (iPhone SE): 13px
            fontSize = 12;
        } else if (tileWidth < 120) {
            // Standard phones (iPhone 12-14): 14px
            fontSize = 13;
        } else if (tileWidth < 150) {
            // Large phones (iPhone 14 Plus): 15px
            fontSize = 13;
        } else {
            // Tablets: 16-18px based on tile size
            fontSize = Math.min(16 + Math.floor((tileWidth - 150) / 50), 18);
        }
        
        // Corner offset: 6-10px based on tile size
        const cornerOffset = Math.min(Math.max(tileWidth * 0.08, 6), 10);
        
        return {
            iconSize: Math.round(iconSize),
            fontSize,
            cornerOffset: Math.round(cornerOffset),
        };
    }, [width]);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.categoryTile}
            activeOpacity={0.8}
        >
            <View
                testID={`category-tile-${category.id}`}
                style={[styles.categoryBg]}
            >
                {/* Category Name - Bottom Left */}
                <View style={styles.categoryNameContainer}>
                    <Text style={[styles.categoryName, { fontSize: responsiveSizes.fontSize }]}>
                        {category.name}
                    </Text>
                </View>

                {/* Category Icon/Image - Top Right */}
                {hasIcon ? (
                    <Image
                        testID={`category-icon-${category.id}`}
                        source={categoryIcon}
                        style={[
                            styles.categoryIcon,
                            {
                                width: responsiveSizes.iconSize,
                                height: responsiveSizes.iconSize,
                                top: responsiveSizes.cornerOffset,
                                right: responsiveSizes.cornerOffset,
                            }
                        ]}
                        resizeMode="contain"
                    />
                ) : hasImage ? (
                    <Image
                        testID={`category-image-${category.id}`}
                        source={{ uri: category.image }}
                        style={[
                            styles.categoryIcon,
                            {
                                width: responsiveSizes.iconSize,
                                height: responsiveSizes.iconSize,
                                top: responsiveSizes.cornerOffset,
                                right: responsiveSizes.cornerOffset,
                            }
                        ]}
                        resizeMode="contain"
                    />
                ) : null}
            </View>
        </TouchableOpacity>
    );
};
