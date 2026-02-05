import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { isValidImageUrl } from '../../../../common/utils/imageUtils';
import { styles } from './styles';
import { Category } from './types';

interface CategoriesGridItemProps {
    category: Category;
    onPress: () => void;
    // Passing these helpers as props or imports would be better, but importing them here:
    // We need getCategoryIcon logic. For now, assuming it's imported or passed.
    // Actually, getCategoryIcon is a helper in CategoriesGrid.tsx, I should move it to a util or duplicate logic?
    // User plan says to create this component.
    // I will assume I can access getCategoryIcon or just inline a simple version or move it to a shared file.
    // For now, I will accept getCategoryIcon functionality or simplified version.
    categoryIcon: ReturnType<typeof require> | null;
}

function CategoryOverlay({
    backgroundColor,
    itemCount,
    name
}: {
    backgroundColor: string;
    itemCount: number;
    name: string;
}) {
    return (
        <View style={styles.categoryOverlay}>
            <View style={[styles.categoryOverlayBg, { backgroundColor }]} />
            <View style={styles.categoryOverlayContent}>
                <Text style={styles.categoryCount}>{itemCount}</Text>
                <Text style={styles.categoryName}>{name}</Text>
            </View>
        </View>
    );
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
            {hasIcon ? (
                <ImageBackground
                    testID={`category-icon-background-${category.id}`}
                    source={categoryIcon}
                    style={styles.categoryBg}
                    imageStyle={styles.categoryBgImage}
                    resizeMode="cover"
                >
                    <CategoryOverlay
                        backgroundColor={category.backgroundColor}
                        itemCount={category.itemCount}
                        name={category.name}
                    />
                </ImageBackground>
            ) : hasImage ? (
                <ImageBackground
                    testID={`category-image-background-${category.id}`}
                    source={{ uri: category.image }}
                    style={styles.categoryBg}
                    imageStyle={styles.categoryBgImage}
                    resizeMode="cover"
                >
                    <CategoryOverlay
                        backgroundColor={category.backgroundColor}
                        itemCount={category.itemCount}
                        name={category.name}
                    />
                </ImageBackground>
            ) : (
                <View
                    testID={`category-no-image-${category.id}`}
                    style={[styles.categoryBg, { backgroundColor: category.backgroundColor }]}
                >
                    <CategoryOverlay
                        backgroundColor={category.backgroundColor}
                        itemCount={category.itemCount}
                        name={category.name}
                    />
                </View>
            )}
        </TouchableOpacity>
    );
};
