/**
 * Tests for useShoppingRealtime custom hook
 * 
 * Tests the custom hook that manages realtime subscriptions for shopping lists and items.
 * Verifies subscription setup, event handling, cleanup, and error handling.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useShoppingRealtime } from '../useShoppingRealtime';
import { supabase } from '../../../../services/supabase';
import type { ICacheAwareShoppingRepository } from '../../../../common/repositories/cacheAwareShoppingRepository';
import type { ShoppingList, ShoppingItem } from '../../../../mocks/shopping';
import type { GroceryItem } from '../../components/GrocerySearchBar';

// Mock Supabase
jest.mock('../../../../services/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useShoppingRealtime', () => {
  let mockRepository: jest.Mocked<ICacheAwareShoppingRepository>;
  let mockChannel: any;
  let mockOn: jest.Mock;
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  const defaultOptions = {
    isRealtimeEnabled: true,
    householdId: 'household-1',
    isSignedIn: true,
    repository: null as ICacheAwareShoppingRepository | null,
    groceryItems: [] as GroceryItem[],
    listIds: ['list-1', 'list-2'],
    onListChange: undefined as ((lists: ShoppingList[]) => void) | undefined,
    onItemChange: undefined as ((items: ShoppingItem[]) => void) | undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOn = jest.fn();
    mockSubscribe = jest.fn();
    mockUnsubscribe = jest.fn();

    mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    };

    mockSupabase.channel.mockReturnValue(mockChannel as any);

    mockRepository = {
      applyRealtimeListChange: jest.fn().mockResolvedValue(undefined),
      applyRealtimeItemChange: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  describe('subscription setup', () => {
    it('should create channels when realtime is enabled', () => {
      // Arrange & Act
      renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
        })
      );

      // Assert
      expect(mockSupabase.channel).toHaveBeenCalledWith('shopping-lists-household-1');
      expect(mockSupabase.channel).toHaveBeenCalledWith('shopping-items-household-1');
      expect(mockOn).toHaveBeenCalledTimes(2); // Once for lists, once for items
      expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });

    it('should not create channels when realtime is disabled', () => {
      // Arrange & Act
      renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          isRealtimeEnabled: false,
          repository: mockRepository,
        })
      );

      // Assert
      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should not create channels when householdId is null', () => {
      // Arrange & Act
      renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          householdId: null,
          repository: mockRepository,
        })
      );

      // Assert
      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should set up list subscription with correct filter', () => {
      // Arrange & Act
      renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
        })
      );

      // Assert
      const listCall = mockOn.mock.calls.find(call => 
        call[1]?.table === 'shopping_lists'
      );
      expect(listCall).toBeDefined();
      expect(listCall[1]).toMatchObject({
        event: '*',
        schema: 'public',
        table: 'shopping_lists',
        filter: 'household_id=eq.household-1',
      });
    });

    it('should set up item subscription with list filter', () => {
      // Arrange & Act
      renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
          listIds: ['list-1', 'list-2'],
        })
      );

      // Assert
      const itemCall = mockOn.mock.calls.find(call => 
        call[1]?.table === 'shopping_items'
      );
      expect(itemCall).toBeDefined();
      expect(itemCall[1]).toMatchObject({
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: 'list_id=in.(list-1,list-2)',
      });
    });
  });

  describe('event handling', () => {
    it('should call repository method for signed-in users on list change', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
        })
      );

      // Get the event handler from the channel.on call
      const listHandler = mockOn.mock.calls.find(
        call => call[1]?.table === 'shopping_lists'
      )?.[2];

      // Act
      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: 'list-1', name: 'Updated', household_id: 'household-1' },
      };
      await listHandler?.(payload);

      // Assert
      await waitFor(() => {
        expect(mockRepository.applyRealtimeListChange).toHaveBeenCalledWith(payload);
      });
    });

    it('should call repository method for signed-in users on item change', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
          groceryItems: [{ id: 'g-1', name: 'Milk', category: 'Dairy', defaultQuantity: 1 }],
        })
      );

      // Get the event handler from the channel.on call
      const itemHandler = mockOn.mock.calls.find(
        call => call[1]?.table === 'shopping_items'
      )?.[2];

      // Act
      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: 'item-1', list_id: 'list-1', name: 'Milk', is_checked: true },
      };
      await itemHandler?.(payload);

      // Assert
      await waitFor(() => {
        expect(mockRepository.applyRealtimeItemChange).toHaveBeenCalledWith(
          payload,
          [{ id: 'g-1', name: 'Milk', category: 'Dairy', defaultQuantity: 1 }]
        );
      });
    });

    it('should call onListChange callback for guest users', async () => {
      // Arrange
      const onListChange = jest.fn();
      const { result } = renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          isSignedIn: false,
          repository: null,
          onListChange,
        })
      );

      // Get the event handler
      const listHandler = mockOn.mock.calls.find(
        call => call[1]?.table === 'shopping_lists'
      )?.[2];

      // Act
      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: 'list-1', name: 'Updated', household_id: 'household-1' },
      };
      await listHandler?.(payload);

      // Assert
      await waitFor(() => {
        expect(onListChange).toHaveBeenCalled();
      });
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe and remove channels on unmount', () => {
      // Arrange
      const { unmount } = renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
        })
      );

      // Act
      unmount();

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2);
    });

    it('should cleanup and resubscribe when dependencies change', () => {
      // Arrange
      const { rerender } = renderHook(
        ({ householdId }) =>
          useShoppingRealtime({
            ...defaultOptions,
            householdId,
            repository: mockRepository,
          }),
        { initialProps: { householdId: 'household-1' } }
      );

      // Act
      rerender({ householdId: 'household-2' });

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockSupabase.channel).toHaveBeenCalledWith('shopping-lists-household-2');
    });
  });

  describe('error handling', () => {
    it('should continue operating when repository methods are called', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
        })
      );

      // Get the event handler
      const listHandler = mockOn.mock.calls.find(
        call => call[1]?.table === 'shopping_lists'
      )?.[2];

      // Act
      const payload = {
        eventType: 'UPDATE' as const,
        new: { id: 'list-1', name: 'Updated', household_id: 'household-1' },
      };
      
      // Call handler - repository errors are handled within repository methods
      // (tested in repository tests). The hook should continue operating.
      if (listHandler) {
        await listHandler(payload);
      }

      // Assert - hook should still be subscribed
      expect(result.current.isSubscribed).toBe(true);
      expect(mockRepository.applyRealtimeListChange).toHaveBeenCalledWith(payload);
    });

    // Note: Repository error handling is tested in cacheAwareShoppingRepository.realtime.test.ts
    // The hook uses 'void' for fire-and-forget, so errors are handled in repository methods
  });

  describe('return values', () => {
    it('should return isSubscribed true when channels are subscribed', () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          repository: mockRepository,
        })
      );

      // Assert
      expect(result.current.isSubscribed).toBe(true);
    });

    it('should return isSubscribed false when realtime is disabled', () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useShoppingRealtime({
          ...defaultOptions,
          isRealtimeEnabled: false,
          repository: mockRepository,
        })
      );

      // Assert
      expect(result.current.isSubscribed).toBe(false);
    });
  });
});
