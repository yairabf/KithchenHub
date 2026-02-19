import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from '../OfflineBanner';

jest.mock('../../../contexts/NetworkContext', () => ({
  useNetwork: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockedUseNetwork = require('../../../contexts/NetworkContext').useNetwork as jest.Mock;

describe('OfflineBanner', () => {
  describe.each([
    ['offline with connection type', { isOffline: true, connectionType: 'wifi' }, true, true],
    ['online', { isOffline: false }, false, false],
  ])('state: %s', (_label, mockValue, shouldRender, shouldShowConnection) => {
    it('renders based on offline state', () => {
      mockedUseNetwork.mockReturnValue(mockValue);

      const { getByText, queryByText } = render(<OfflineBanner />);

      if (shouldRender) {
        expect(getByText('offline.banner')).toBeTruthy();
      } else {
        expect(queryByText('offline.banner')).toBeNull();
      }

      if (shouldShowConnection) {
        expect(getByText('offline.connectionType')).toBeTruthy();
      } else {
        expect(queryByText('offline.connectionType')).toBeNull();
      }
    });
  });
});
