/**
 * Offline Pill Component Tests
 * 
 * Tests for the OfflinePill component that displays offline state and sync status.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflinePill } from '../OfflinePill';

jest.mock('../../../contexts/NetworkContext', () => ({
  useNetwork: jest.fn(),
}));

jest.mock('../../../common/hooks/useSyncStatus', () => ({
  useSyncQueueStatus: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockedUseNetwork = require('../../../contexts/NetworkContext').useNetwork as jest.Mock;
const mockedUseSyncQueueStatus = require('../../../common/hooks/useSyncStatus').useSyncQueueStatus as jest.Mock;

describe('OfflinePill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockedUseNetwork.mockReturnValue({ isOffline: false });
    mockedUseSyncQueueStatus.mockReturnValue({
      totalPending: 0,
      isProcessing: false,
      failedCount: 0,
    });
  });

  describe('visibility states', () => {
    describe.each([
      ['offline state', { isOffline: true }, { totalPending: 0, isProcessing: false, failedCount: 0 }, true, 'Offline'],
      ['pending items', { isOffline: false }, { totalPending: 3, isProcessing: false, failedCount: 0 }, true, '3 pending'],
      ['syncing state', { isOffline: false }, { totalPending: 0, isProcessing: true, failedCount: 0 }, true, 'Syncing...'],
      ['failed items', { isOffline: false }, { totalPending: 0, isProcessing: false, failedCount: 2 }, true, '2 failed'],
      ['online with no pending', { isOffline: false }, { totalPending: 0, isProcessing: false, failedCount: 0 }, false, null],
    ])('%s', (description, networkState, queueStatus, shouldRender, expectedText) => {
      it(`should ${shouldRender ? 'render' : 'not render'}`, () => {
        mockedUseNetwork.mockReturnValue(networkState);
        mockedUseSyncQueueStatus.mockReturnValue(queueStatus);

        const { queryByText } = render(<OfflinePill />);

        if (shouldRender && expectedText) {
          expect(queryByText(expectedText)).toBeTruthy();
        } else {
          expect(queryByText('Offline')).toBeNull();
          expect(queryByText('pending')).toBeNull();
          expect(queryByText('Syncing')).toBeNull();
        }
      });
    });
  });

  describe('position prop', () => {
    describe.each([
      ['top-right', 'top-right'],
      ['bottom-right', 'bottom-right'],
      ['top-left', 'top-left'],
      ['bottom-left', 'bottom-left'],
    ])('%s', (description, position) => {
      it(`should apply ${position} position`, () => {
        mockedUseNetwork.mockReturnValue({ isOffline: true });

        const { queryByText } = render(<OfflinePill position={position as any} />);
        // Component should render when offline
        expect(queryByText('Offline')).toBeTruthy();
      });
    });
  });

  describe('dismissible prop', () => {
    it('should render when dismissible is true', () => {
      mockedUseNetwork.mockReturnValue({ isOffline: true });

      const { queryByText } = render(<OfflinePill dismissible={true} />);
      // Component should render
      expect(queryByText('Offline')).toBeTruthy();
    });

    it('should render when dismissible is false', () => {
      mockedUseNetwork.mockReturnValue({ isOffline: true });

      const { queryByText } = render(<OfflinePill dismissible={false} />);
      // Component should render
      expect(queryByText('Offline')).toBeTruthy();
    });
  });

  describe('showPendingCount prop', () => {
    it('should show count when showPendingCount is true', () => {
      mockedUseNetwork.mockReturnValue({ isOffline: false });
      mockedUseSyncQueueStatus.mockReturnValue({
        totalPending: 5,
        isProcessing: false,
        failedCount: 0,
      });

      const { getByText } = render(<OfflinePill showPendingCount={true} />);

      expect(getByText('5 pending')).toBeTruthy();
    });

    it('should show generic text when showPendingCount is false', () => {
      mockedUseNetwork.mockReturnValue({ isOffline: false });
      mockedUseSyncQueueStatus.mockReturnValue({
        totalPending: 5,
        isProcessing: false,
        failedCount: 0,
      });

      const { getByText } = render(<OfflinePill showPendingCount={false} />);

      expect(getByText('Pending')).toBeTruthy();
    });
  });
});
