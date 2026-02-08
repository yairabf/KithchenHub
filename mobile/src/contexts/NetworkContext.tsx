import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import NetInfo, { useNetInfo, NetInfoStateType } from '@react-native-community/netinfo';
import { setNetworkStatusProvider, API_BASE_URL } from '../services/api';
import { setNetworkStatusProvider as setCacheNetworkStatusProvider } from '../common/utils/networkStatus';

type NetworkContextValue = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null | undefined;
  isOffline: boolean;
  connectionType: NetInfoStateType | undefined;
  isExpensive: boolean;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

/** Default reachability config (native): Google's endpoint; blocked by CORS on web. */
const NETINFO_CONFIG_NATIVE = {
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTest: (response: Response) => response.status === 204,
  reachabilityShortTimeout: 5_000,
  reachabilityLongTimeout: 60_000,
  reachabilityRequestTimeout: 15_000,
};

/** On web, use our API health endpoint to avoid CORS (Google blocks cross-origin from localhost). */
function getNetInfoConfig() {
  if (Platform.OS === 'web') {
    return {
      ...NETINFO_CONFIG_NATIVE,
      reachabilityUrl: `${API_BASE_URL}/api/v1/health`,
      reachabilityTest: (response: Response) => response.ok,
    };
  }
  return NETINFO_CONFIG_NATIVE;
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const netInfo = useNetInfo();

  useEffect(() => {
    NetInfo.configure(getNetInfoConfig());
  }, []);

  const value = useMemo<NetworkContextValue>(() => {
    const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;
    return {
      isConnected: netInfo.isConnected ?? null,
      isInternetReachable: netInfo.isInternetReachable,
      isOffline,
      connectionType: netInfo.type,
      isExpensive: netInfo.details?.isConnectionExpensive ?? false,
    };
  }, [
    netInfo.isConnected,
    netInfo.isInternetReachable,
    netInfo.type,
    netInfo.details?.isConnectionExpensive,
  ]);

  // Expose network status to API client
  useEffect(() => {
    setNetworkStatusProvider(() => ({ isOffline: value.isOffline }));
  }, [value.isOffline]);

  // Expose network status to cache layer
  useEffect(() => {
    setCacheNetworkStatusProvider(() => !value.isOffline);
  }, [value.isOffline]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
