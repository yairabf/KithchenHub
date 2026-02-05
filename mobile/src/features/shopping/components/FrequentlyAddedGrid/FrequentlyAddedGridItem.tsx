import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { CatalogItem } from '../../../../mocks/shopping';

interface FrequentlyAddedGridItemProps {
    item: CatalogItem;
    onAdd: () => void;
}

export const FrequentlyAddedGridItem: React.FC<FrequentlyAddedGridItemProps> = ({
    item,
    onAdd,
}) => {
    return (
        <TouchableOpacity
            style={styles.itemTile}
            onPress={onAdd}
            activeOpacity={0.8}
            accessibilityLabel={`Add ${item.name} to list`}
            accessibilityRole="button"
        >
            <View style={styles.itemImageContainer}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                />
            </View>
            <View style={styles.itemNameContainer}>
                <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Ionicons name="add-circle" size={14} color={colors.primary} />
            </View>
        </TouchableOpacity>
    );
};
