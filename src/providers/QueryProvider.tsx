"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Refetch when window regains focus
                refetchOnWindowFocus: true,
                // Keep data fresh for 30 seconds
                staleTime: 30 * 1000,
                // Cache for 5 minutes
                gcTime: 5 * 60 * 1000,
                // Retry failed requests 2 times
                retry: 2,
                // Don't keep retrying forever
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
