import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { GrocerySearchBar, GroceryItem } from '../GrocerySearchBar';
import { mockGroceriesDB } from '../../../../data/groceryDatabase';
import { mockQuickActionLists } from '../../../../mocks/shopping';
import { styles } from './styles';
import { ShoppingQuickActionModalProps } from './types';

export function ShoppingQuickActionModal({ visible, onClose }: ShoppingQuickActionModalProps) {
  const [activeListId, setActiveListId] = useState(mockQuickActionLists[0].id);

  const activeList = mockQuickActionLists.find(l => l.id === activeListId);

  const handleQuickAddItem = (groceryItem: GroceryItem) => {
    // Immediately add the item with default quantity
    console.log('Adding item:', {
      name: groceryItem.name,
      quantity: groceryItem.defaultQuantity,
      category: groceryItem.category,
      listId: activeListId,
    });
    // Keep dropdown open and search query intact for rapid multi-item addition
  };

  const handleSelectGroceryItem = (groceryItem: GroceryItem) => {
    // This would open a quantity modal in a full implementation
    console.log('Opening quantity modal for:', groceryItem.name);
    // Keep dropdown open so user can continue adding items after modal closes
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title="Quick Add"
      showActions={false}
    >
      <View>
        {/* List Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.listSwitcher}
          contentContainerStyle={styles.listSwitcherContent}
        >
          {mockQuickActionLists.map(list => (
            <TouchableOpacity
              key={list.id}
              style={[
                styles.listBubble,
                activeListId === list.id && { backgroundColor: list.color },
              ]}
              onPress={() => setActiveListId(list.id)}
            >
              <Text
                style={[
                  styles.listBubbleText,
                  activeListId === list.id && { color: colors.textLight },
                ]}
              >
                {list.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Bar using reusable component */}
        <GrocerySearchBar
          items={mockGroceriesDB}
          onSelectItem={handleSelectGroceryItem}
          onQuickAddItem={handleQuickAddItem}
          variant="background"
          showShadow={false}
          allowCustomItems={true}
        />
      </View>
    </CenteredModal>
  );
}
