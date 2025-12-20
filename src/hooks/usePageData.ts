"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

interface UsePageDataOptions<T> {
    fetcher: () => Promise<T>;
    defaultValue: T;
    deps?: unknown[];
    refetchOnFocus?: boolean;
}

interface UsePageDataResult<T> {
    data: T;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook for page data fetching with:
 * - Automatic retry on visibility change (tab switch)
 * - Error handling
 * - Loading state management
 */
export function usePageData<T>({
    fetcher,
    defaultValue,
    deps = [],
    refetchOnFocus = true,
}: UsePageDataOptions<T>): UsePageDataResult<T> {
    const [data, setData] = useState<T>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const isMountedRef = useRef(true);
    const lastFetchRef = useRef<number>(0);

    const fetchData = useCallback(async (showLoading = true) => {
        // Prevent concurrent fetches
        const now = Date.now();
        if (now - lastFetchRef.current < 1000) return;
        lastFetchRef.current = now;

        try {
            if (showLoading) setIsLoading(true);
            setError(null);

            const result = await fetcher();

            if (isMountedRef.current) {
                setData(result);
            }
        } catch (err) {
            console.error('Error fetching page data:', err);
            if (isMountedRef.current) {
                setError(err instanceof Error ? err : new Error('Fetch failed'));
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetcher, ...deps]);

    // Initial fetch
    useEffect(() => {
        isMountedRef.current = true;
        fetchData();

        return () => {
            isMountedRef.current = false;
        };
    }, [fetchData]);

    // Refetch on visibility change
    useEffect(() => {
        if (!refetchOnFocus) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Small delay to let browser wake up
                setTimeout(() => {
                    if (isMountedRef.current) {
                        fetchData(false); // Silent refresh
                    }
                }, 100);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [fetchData, refetchOnFocus]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
    };
}
