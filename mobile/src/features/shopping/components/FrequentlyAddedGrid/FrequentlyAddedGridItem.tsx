import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { GroceryItem } from '../GrocerySearchBar';

interface FrequentlyAddedGridItemProps {
    item: GroceryItem;
    onAdd: () => void;
}

export const FrequentlyAddedGridItem: React.FC<FrequentlyAddedGridItemProps> = ({
    item,
    onAdd,
}) => {
    const { t } = useTranslation('shopping');
    return (
        <TouchableOpacity
            style={styles.itemTile}
            onPress={onAdd}
            activeOpacity={0.8}
            accessibilityLabel={t('frequentlyAdded.addItemAccessibility', { name: item.name })}
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
