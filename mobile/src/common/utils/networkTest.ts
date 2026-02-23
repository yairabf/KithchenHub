/**
 * Network connectivity test utility for debugging device/emulator connectivity.
 * Use this to verify the backend API is reachable from the mobile app.
 * 
 * @module networkTest
 */

import { Platform } from 'react-native';
import { API_BASE_URL } from '../../services/api';

/** Timeout duration for network connectivity test in milliseconds */
const NETWORK_TEST_TIMEOUT_MS = 5000;

/**
 * Result object returned by testBackendConnectivity function.
 */
export interface NetworkTestResult {
  /** Whether the connectivity test succeeded */
  success: boolean;
  /** Platform the test was run on (ios, android, web) */
  platform: string;
  /** The API base URL that was tested */
  apiBaseUrl: string;
  /** Error message if test failed */
  error?: string;
  /** Time taken for the test in milliseconds */
  responseTime?: number;
}

/**
 * Tests connectivity to the backend API health endpoint.
 * Attempts to reach the `/api/health` endpoint with a 5-second timeout.
 * 
 * @returns Promise resolving to test results including success status, timing, and any errors
 * 
 * @example
 * const result = await testBackendConnectivity();
 * if (result.success) {
 *   console.log(`Connected in ${result.responseTime}ms`);
 * } else {
 *   console.error(`Connection failed: ${result.error}`);
 * }
 */
export async function testBackendConnectivity(): Promise<NetworkTestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`[NetworkTest] Testing connection to: ${API_BASE_URL}`);
    console.log(`[NetworkTest] Platform: ${Platform.OS}`);
    
    // Test simple fetch to the API health endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TEST_TIMEOUT_MS);
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    console.log(`[NetworkTest] Response status: ${response.status}`);
    console.log(`[NetworkTest] Response time: ${responseTime}ms`);
    
    if (response.ok) {
      return {
        success: true,
        platform: Platform.OS,
        apiBaseUrl: API_BASE_URL,
        responseTime,
      };
    } else {
      return {
        success: false,
        platform: Platform.OS,
        apiBaseUrl: API_BASE_URL,
        error: `HTTP ${response.status}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[NetworkTest] Connection failed:`, errorMessage);
    
    return {
      success: false,
      platform: Platform.OS,
      apiBaseUrl: API_BASE_URL,
      error: errorMessage,
      responseTime,
    };
  }
}
