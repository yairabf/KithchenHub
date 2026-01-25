/**
 * Network Status Provider
 * 
 * Provides a way to access network status outside of React components.
 * This allows services and repositories to check online/offline status
 * without requiring React context injection.
 */

/**
 * Network status provider function type
 */
type NetworkStatusProvider = () => boolean;

/**
 * Default network status provider (assumes online)
 * This is a safe default that will be replaced by NetworkContext
 */
let networkStatusProvider: NetworkStatusProvider = () => true;

/**
 * Sets the network status provider function
 * Should be called from NetworkContext to keep status in sync
 * 
 * @param provider - Function that returns true if online, false if offline
 */
export function setNetworkStatusProvider(provider: NetworkStatusProvider): void {
  networkStatusProvider = provider;
}

/**
 * Gets the current network status
 * 
 * @returns True if online, false if offline
 */
export function getIsOnline(): boolean {
  return networkStatusProvider();
}
