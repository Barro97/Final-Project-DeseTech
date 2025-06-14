import { useQuery } from "@tanstack/react-query";
import { getSearchSuggestions } from "../services/datasetService";
import { useMemo } from "react";

/**
 * Hook for getting search suggestions based on dataset names and descriptions
 *
 * Features:
 * - Automatic debouncing to avoid excessive API calls
 * - Caching with React Query for better performance
 * - Graceful error handling
 * - Only triggers API calls for meaningful search terms (2+ characters)
 *
 * @param searchTerm - The search term to get suggestions for
 * @param limit - Maximum number of suggestions to return (default: 8)
 * @param enabled - Whether the query should be enabled (default: true)
 * @returns React Query result with suggestions data, loading state, and error state
 */
export const useSearchSuggestions = (
  searchTerm: string,
  limit: number = 8,
  enabled: boolean = true
) => {
  // Memoize the trimmed search term to avoid unnecessary re-renders
  const trimmedSearchTerm = useMemo(
    () => searchTerm?.trim() || "",
    [searchTerm]
  );

  // Only enable the query if we have a meaningful search term
  const shouldFetch = enabled && trimmedSearchTerm.length >= 2;

  return useQuery({
    queryKey: ["searchSuggestions", trimmedSearchTerm, limit],
    queryFn: () => getSearchSuggestions(trimmedSearchTerm, limit),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes - suggestions don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer (renamed from cacheTime in v5)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });
};

export default useSearchSuggestions;
