/**
 * React Query Configuration
 * Global settings for data fetching and caching
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 1 minute
            staleTime: 1000 * 60,
            // Keep unused data in cache for 5 minutes
            gcTime: 1000 * 60 * 5,
            // Disable automatic refetch on window focus to prevent excessive requests
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
        },
    },
});
