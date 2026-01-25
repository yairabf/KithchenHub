import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useNetwork, NetworkProvider } from '../NetworkContext';

const mockUseNetInfo = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => mockUseNetInfo(),
  NetInfoStateType: {
    wifi: 'wifi',
    cellular: 'cellular',
    none: 'none',
    unknown: 'unknown',
  },
  configure: jest.fn(),
}));

describe('NetworkContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NetworkProvider>{children}</NetworkProvider>
  );

  describe.each([
    [
      'online via wifi',
      {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: { isConnectionExpensive: false },
      },
      false,
      'wifi',
    ],
    [
      'offline via disconnected',
      {
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: { isConnectionExpensive: false },
      },
      true,
      'none',
    ],
    [
      'offline via unreachable internet',
      {
        isConnected: true,
        isInternetReachable: false,
        type: 'cellular',
        details: { isConnectionExpensive: true },
      },
      true,
      'cellular',
    ],
  ])('network state: %s', (_label, netInfoState, expectedOffline, expectedType) => {
    it('derives offline and connection type correctly', () => {
      mockUseNetInfo.mockReturnValue(netInfoState);

      const { result } = renderHook(() => useNetwork(), { wrapper });

      expect(result.current.isOffline).toBe(expectedOffline);
      expect(result.current.connectionType).toBe(expectedType);
    });
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useNetwork())).toThrow(
      'useNetwork must be used within a NetworkProvider'
    );
  });
});
