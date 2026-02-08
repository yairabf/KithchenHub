import { useEffect, useRef, useState } from 'react';

interface UseDebouncedRemoteSearchOptions<T> {
  delay?: number;
  enabled?: boolean;
  onError?: (error: unknown) => void;
  /** Search query; leading/trailing whitespace is trimmed before calling searchFn. */
  query: string;
  /**
   * Async function that performs the search. Must be a stable reference (e.g. from useCallback
   * or a stable module/context) to avoid unnecessary effect re-runs and duplicate requests.
   */
  searchFn?: (query: string) => Promise<T[]>;
}

export function useDebouncedRemoteSearch<T>({
  delay = 300,
  enabled = true,
  onError,
  query,
  searchFn,
}: UseDebouncedRemoteSearchOptions<T>) {
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled || !searchFn) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const currentRequestId = ++requestId.current;
    const trimmedQuery = query.trim();
    const timer = setTimeout(async () => {
      if (!trimmedQuery) {
        if (requestId.current === currentRequestId) {
          setResults([]);
          setIsSearching(false);
        }
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchFn(trimmedQuery);
        if (requestId.current !== currentRequestId) {
          return;
        }
        setResults(response);
      } catch (error) {
        onError?.(error);
        if (requestId.current === currentRequestId) {
          setResults([]);
        }
      } finally {
        if (requestId.current === currentRequestId) {
          setIsSearching(false);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, enabled, query, searchFn]);

  return { results, isSearching };
}
