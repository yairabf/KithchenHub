import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { isValidImageUrl } from '../../../../common/utils/imageUtils';
import { TILE_GAP, styles, NAME_ZONE_MIN_HEIGHT } from './styles';
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

    /**
     * Measured width of the grid container from parent onLayout.
     * Falls back to window width when not yet measured.
     */
    gridWidth?: number;
}

export const CategoriesGridItem: React.FC<CategoriesGridItemProps> = ({
    category,
    onPress,
    categoryIcon,
    gridWidth
}) => {
    const { width } = useWindowDimensions();
    const hasImage = isValidImageUrl(category.image);
    const hasIcon = categoryIcon !== null;

    /**
     * Calculate responsive sizes so image stays top-right, name stays bottom-left,
     * and they never overlap. On small screens both scale down to fit.
     */
    const responsiveSizes = useMemo(() => {
        // Exact pixel width so all gutters (left edge, between tiles, right edge) = TILE_GAP.
        // Formula: containerWidth - 4*TILE_GAP (left + 2 between + right) divided by 3 columns.
        // Use measured grid width when available; fallback keeps first paint stable.
        const COLUMNS = 3;
        const fallbackContainerWidth = width - 48; // shopping screen horizontal padding (24 * 2)
        const containerWidth = gridWidth && gridWidth > 0 ? gridWidth : fallbackContainerWidth;
        const tileWidth = (containerWidth - (COLUMNS + 1) * TILE_GAP) / COLUMNS;
        const tileHeight = tileWidth; // aspect ratio 1

        const cornerOffset = Math.min(Math.max(tileWidth * 0.08, 6), 10);

        // Max space for icon: above the reserved name zone, inside tile
        const maxIconHeight = tileHeight - NAME_ZONE_MIN_HEIGHT - 2 * cornerOffset;
        const maxIconWidth = tileWidth - 2 * cornerOffset;
        const rawIconSize = Math.min(tileWidth * 0.65, 100);
        const iconSize = Math.max(
            32,
            Math.min(
                rawIconSize,
                maxIconHeight,
                maxIconWidth,
            )
        );

        // Font size: scale down on small tiles so name fits in one line
        let fontSize: number;
        if (tileWidth < 100) {
            fontSize = 11;
        } else if (tileWidth < 120) {
            fontSize = 12;
        } else if (tileWidth < 150) {
            fontSize = 13;
        } else {
            fontSize = Math.min(16 + Math.floor((tileWidth - 150) / 50), 18);
        }

        return {
            tileWidth: Math.floor(tileWidth), // floor prevents 3rd tile wrapping due to sub-pixel rounding
            iconSize: Math.round(iconSize),
            fontSize,
            cornerOffset: Math.round(cornerOffset),
        };
    }, [gridWidth, width]);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.categoryTile, { width: responsiveSizes.tileWidth }]}
            activeOpacity={0.8}
        >
            <View
                testID={`category-tile-${category.id}`}
                style={[styles.categoryBg]}
            >
                {/* Category Name - Bottom left, single line, never overlaps image */}
                <View style={styles.categoryNameContainer}>
                    <Text
                        style={[styles.categoryName, { fontSize: responsiveSizes.fontSize }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {category.name}
                    </Text>
                </View>

                {/* Category Icon/Image - Top right, constrained to stay above name zone */}
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
