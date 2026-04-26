import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ChoresScreen } from '../ChoresScreen';

const mockDelete = jest.fn();
let mockCachedChores = [
  {
    id: 'chore-1',
    localId: 'local-chore-1',
    title: 'Take out trash',
    dueDate: '2024-03-15',
    dueTime: '10:00 AM',
    isCompleted: false,
    section: 'today',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
];

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { dir: () => 'ltr', language: 'en' },
  }),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../../../common/hooks/useCachedEntities', () => ({
  useCachedEntities: () => ({
    data: mockCachedChores,
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('../../../../common/repositories/cacheAwareChoreRepository', () => ({
  CacheAwareChoreRepository: jest.fn().mockImplementation(() => ({
    findAll: jest.fn().mockResolvedValue(mockCachedChores),
    refresh: jest.fn().mockResolvedValue(mockCachedChores),
    delete: mockDelete,
    update: jest.fn(),
    create: jest.fn(),
    toggle: jest.fn(),
  })),
}));

jest.mock('../../services/choresService', () => ({
  createChoresService: jest.fn(() => ({
    getChores: jest.fn(),
  })),
}));

jest.mock('../../../../common/components/ScreenHeader', () => ({
  ScreenHeader: () => null,
}));

jest.mock('../../../../common/components/ShareModal', () => ({
  ShareModal: () => null,
}));

jest.mock('../../../../common/components/EmptyState', () => ({
  EmptyState: () => null,
}));

jest.mock('../../../../common/components/ListItemSkeleton', () => ({
  ListItemSkeleton: () => null,
}));

jest.mock('../../components/ChoresProgressCard', () => ({
  ChoresProgressCard: () => null,
}));

jest.mock('../../components/ChoresSection', () => ({
  ChoresSection: ({ title, chores, renderChoreCard }: { title: string; chores: Array<any>; renderChoreCard: (chore: any) => React.ReactNode }) => (
    <>
      {chores.map((chore) => renderChoreCard(chore))}
    </>
  ),
}));

jest.mock('../../components/ChoreDetailsModal', () => ({
  ChoreDetailsModal: () => null,
}));

jest.mock('../../components/ChoreCard', () => ({
  ChoreCard: ({ chore, onDelete }: { chore: { id: string; title: string }; onDelete: (id: string) => void }) => {
    const React = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View>
        <Text>{chore.title}</Text>
        <TouchableOpacity testID={`delete-${chore.id}`} onPress={() => onDelete(chore.id)}>
          <Text>{`delete-${chore.id}`}</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe('ChoresScreen deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCachedChores = [
      {
        id: 'chore-1',
        localId: 'local-chore-1',
        title: 'Take out trash',
        dueDate: '2024-03-15',
        dueTime: '10:00 AM',
        isCompleted: false,
        section: 'today',
        createdAt: '2024-03-15T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
      },
    ];
  });

  it('hides a chore from the UI immediately while delete is still pending', async () => {
    let resolveDelete: () => void;
    mockDelete.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );

    const { getByTestId, queryByText } = render(<ChoresScreen />);

    await waitFor(() => {
      expect(queryByText('Take out trash')).toBeTruthy();
    });

    fireEvent.press(getByTestId('delete-chore-1'));

    expect(queryByText('Take out trash')).toBeNull();

    resolveDelete!();

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('chore-1');
    });
  });
});
