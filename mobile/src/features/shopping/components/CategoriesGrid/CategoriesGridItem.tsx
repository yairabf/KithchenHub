import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
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
    const hasImage = isValidImageUrl(category.image);
    const hasIcon = categoryIcon !== null;

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
                    <Text style={styles.categoryName}>{category.name}</Text>
                </View>

                {/* Category Icon/Image - Top Right */}
                {hasIcon ? (
                    <Image
                        testID={`category-icon-${category.id}`}
                        source={categoryIcon}
                        style={styles.categoryIcon}
                        resizeMode="contain"
                    />
                ) : hasImage ? (
                    <Image
                        testID={`category-image-${category.id}`}
                        source={{ uri: category.image }}
                        style={styles.categoryIcon}
                        resizeMode="contain"
                    />
                ) : null}
            </View>
        </TouchableOpacity>
    );
};
