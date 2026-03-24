import { config } from "../config";
import { logger } from "../common/utils/logger";

export const API_BASE_URL = config.api.baseUrl;

const API_VERSION = config.api.version;

const BASE_URL = `${API_BASE_URL}/api`;

interface ApiOptions extends RequestInit {
  token?: string;
}

type ApiErrorResponse = {
  message?: string;
};

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

type NetworkStatusProvider = () => { isOffline: boolean };

class ApiClient {
  private baseUrl: string;
  private apiVersion: string;
  private authToken: string | null = null;
  private static networkStatusProvider?: NetworkStatusProvider;
  private static readonly REQUEST_TIMEOUT_MS = 15_000;

  private static describePayload(data: unknown): string {
    if (Array.isArray(data)) {
      return `array(length=${data.length})`;
    }

    if (data && typeof data === "object") {
      const keys = Object.keys(data as Record<string, unknown>);
      return `object(keys=${keys.slice(0, 6).join(",")}${keys.length > 6 ? ",…" : ""})`;
    }

    return typeof data === "string" ? `string(length=${data.length})` : String(data);
  }

  constructor(baseUrl: string, apiVersion: string = "1") {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
  }

  /**
   * Sets the authentication token for all subsequent requests.
   * @param token - JWT token or null to clear
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Sets the API version for all subsequent requests.
   * @param version - API version (e.g., '1', '2')
   * @throws Error if version format is invalid
   */
  public setApiVersion(version: string): void {
    if (!/^\d+$/.test(version)) {
      throw new Error(
        `Invalid API version format: ${version}. Must be a positive integer (e.g., '1', '2').`,
      );
    }
    this.apiVersion = version;
  }

  /**
   * Gets the current API version.
   * @returns Current API version
   */
  public getApiVersion(): string {
    return this.apiVersion;
  }

  public static setNetworkStatusProvider(provider?: NetworkStatusProvider) {
    ApiClient.networkStatusProvider = provider;
  }

  private async request<T>(
    endpoint: string,
    options: ApiOptions = {},
  ): Promise<T> {
    const { token, headers, ...customConfig } = options;

    if (ApiClient.networkStatusProvider?.().isOffline) {
      throw new NetworkError("No internet connection");
    }

    // Use provided token or fall back to stored auth token
    const effectiveToken = token || this.authToken;

    const isFormData = customConfig.body instanceof FormData;
    const hasBody =
      customConfig.body !== undefined && customConfig.body !== null;
    const config: RequestInit = {
      ...customConfig,
      headers: {
        ...(!isFormData && hasBody && { "Content-Type": "application/json" }),
        ...(effectiveToken
          ? { Authorization: `Bearer ${effectiveToken}` }
          : {}),
        ...headers,
      },
    };

    const { signal, clearTimeoutRef } = this.createRequestTimeout();

    // Construct URL with version: /api/v1/endpoint or /api/v2/endpoint
    const versionedUrl = `${this.baseUrl}/v${this.apiVersion}${endpoint}`;

    try {
      logger.debug(`[API] ${customConfig.method || "GET"} ${versionedUrl}`);
      const response = await fetch(versionedUrl, { ...config, signal });
      const data = await this.parseJsonResponse(response);
      logger.debug(
        `[API] Response status=${response.status} payload=${ApiClient.describePayload(data)}`,
      );

      if (!response.ok) {
        // If we get 401 and have a token, it's likely expired or invalid
        if (response.status === 401 && effectiveToken) {
          logger.warn(
            "[API] 401 Unauthorized with token - token may be expired or invalid",
          );
          // Trigger unauthorized handler if set (will clear user session)
          if (onUnauthorizedHandler) {
            onUnauthorizedHandler();
          }
        }
        throw this.createApiError(response.status, data);
      }

      // Backend wraps success responses as { success: true, data: T }; unwrap for callers
      const unwrapped = this.unwrapSuccessData(data);
      logger.debug(
        `[API] Unwrapped response payload=${ApiClient.describePayload(unwrapped)} type=${typeof unwrapped} isArray=${Array.isArray(unwrapped)}`,
      );
      return unwrapped as T;
    } catch (error: unknown) {
      if (this.isAbortError(error)) {
        throw new NetworkError("Request timed out");
      }

      if (error instanceof ApiError || error instanceof NetworkError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Network request failed";
      throw new NetworkError(errorMessage);
    } finally {
      clearTimeoutRef();
    }
  }

  public get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: ApiOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  public put<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: ApiOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  public patch<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: ApiOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  public upload<T>(
    endpoint: string,
    formData: FormData,
    options?: ApiOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  }

  private createRequestTimeout() {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      ApiClient.REQUEST_TIMEOUT_MS,
    );
    const clearTimeoutRef = () => clearTimeout(timeoutId);
    return { signal: controller.signal, clearTimeoutRef };
  }

  private async parseJsonResponse(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  private createApiError(statusCode: number, data: unknown): ApiError {
    const message =
      this.getMessageFromResponseData(data) ?? "API request failed";
    return new ApiError(message, statusCode);
  }

  private getMessageFromResponseData(data: unknown): string | undefined {
    if (typeof data !== "object" || data === null) {
      return undefined;
    }

    const message = (data as ApiErrorResponse).message;
    return typeof message === "string" ? message : undefined;
  }

  /**
   * Unwraps backend success format { success: true, data: T } so callers receive T.
   * If the response is not in that format, returns the original payload.
   */
  private unwrapSuccessData(data: unknown): unknown {
    if (typeof data !== "object" || data === null) {
      return data;
    }
    const body = data as Record<string, unknown>;
    if ("data" in body && body.data !== undefined) {
      return body.data;
    }
    return data;
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }
}

export const api = new ApiClient(BASE_URL, API_VERSION);
export const setNetworkStatusProvider = ApiClient.setNetworkStatusProvider;

// Global handler for 401 errors - will be set by AuthContext
let onUnauthorizedHandler: (() => void) | null = null;

export function setOnUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorizedHandler = handler;
}
