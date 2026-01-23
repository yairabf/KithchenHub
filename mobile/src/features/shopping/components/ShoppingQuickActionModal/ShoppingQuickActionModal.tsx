import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { GrocerySearchBar, GroceryItem } from '../GrocerySearchBar';
import type { ShoppingList } from '../../../../mocks/shopping';
import { createShoppingService } from '../../services/shoppingService';
import { config } from '../../../../config';
import { styles } from './styles';
import { ShoppingQuickActionModalProps } from './types';

export function ShoppingQuickActionModal({ visible, onClose }: ShoppingQuickActionModalProps) {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const isMockDataEnabled = config.mockData.enabled;
  const shoppingService = useMemo(
    () => createShoppingService(isMockDataEnabled),
    [isMockDataEnabled]
  );
  const hasLists = shoppingLists.length > 0;

  useEffect(() => {
    let isMounted = true;

    const loadShoppingData = async () => {
      try {
        const data = await shoppingService.getShoppingData();
        if (!isMounted) {
          return;
        }
        setShoppingLists(data.shoppingLists);
        setGroceryItems(data.groceryItems);
        setActiveListId((current) => current ?? data.shoppingLists[0]?.id ?? null);
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load quick add data:', error);
        }
      }
    };

    if (visible) {
      loadShoppingData();
    }

    return () => {
      isMounted = false;
    };
  }, [shoppingService, visible]);

  const handleQuickAddItem = (groceryItem: GroceryItem) => {
    if (!activeListId) {
      console.warn('Quick add skipped: no active list selected.');
      return;
    }
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
        {hasLists ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.listSwitcher}
              contentContainerStyle={styles.listSwitcherContent}
            >
              {shoppingLists.map(list => (
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
              items={groceryItems}
              onSelectItem={handleSelectGroceryItem}
              onQuickAddItem={handleQuickAddItem}
              variant="background"
              showShadow={false}
              allowCustomItems={true}
            />
          </>
        ) : (
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Create a shopping list to use quick add.
          </Text>
        )}
      </View>
    </CenteredModal>
  );
}
