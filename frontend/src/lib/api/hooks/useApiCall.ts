// src/lib/api/hooks/useApiCall.ts

import { useState, useCallback } from 'react';
import { ApiException } from '@/types';

/**
 * Generic async function type.
 * Any API call that returns a Promise can be wrapped by this hook.
 */
type AsyncFn<T> = () => Promise<T>;

/**
 * useApiCall
 * ----------------------------------------------------------------------------
 * A lightweight utility hook to handle:
 *  - loading state
 *  - error state
 *  - try/catch
 *  - finally cleanup
 *
 * Why this exists:
 * ----------------
 * In most components we repeatedly write:
 *
 *   setLoading(true)
 *   try { await apiCall() }
 *   catch (e) { ... }
 *   finally { setLoading(false) }
 *
 * This hook centralizes that pattern so:
 *  - components stay clean
 *  - loading logic is consistent
 *  - errors are standardized
 *
 * This is intentionally NOT React Query.
 * It is a minimal, predictable abstraction suitable for MVP → production.
 */
export function useApiCall<T = any>() {
  /**
   * Indicates whether the API call is currently running.
   * Useful for disabling buttons, showing loaders, etc.
   */
  const [loading, setLoading] = useState(false);

  /**
   * Stores the last API error (if any).
   * Will always be an ApiException thrown by ApiClient.
   */
  const [error, setError] = useState<ApiException | null>(null);

  /**
   * call()
   * --------------------------------------------------------------------------
   * Wrap any async API function inside this method.
   *
   * Example:
   *   await call(() => ProfileService.updateCandidateProfile(data))
   *
   * Responsibilities:
   *  - sets loading = true before execution
   *  - clears previous errors
   *  - executes the API function
   *  - captures errors consistently
   *  - guarantees loading = false in all cases
   */
  const call = useCallback(
    async (fn: AsyncFn<T>): Promise<T> => {
      try {
        // API call started
        setLoading(true);

        // Reset previous error (important for retries)
        setError(null);

        // Execute the actual API function
        return await fn();
      } catch (err) {
        // Normalize error (ApiClient already throws ApiException)
        setError(err as ApiException);

        // Re-throw so caller can still handle it if needed
        throw err;
      } finally {
        // Always stop loading, even if request fails
        setLoading(false);
      }
    },
    []
  );

  /**
   * Returned API:
   *  - call(fn) → execute API
   *  - loading → request in progress
   *  - error → last API error
   */
  return {
    call,
    loading,
    error,
  };
}
