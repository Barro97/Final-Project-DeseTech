import { useQuery } from "@tanstack/react-query";
import {
  userSearchService,
  UserSearchFilters,
  UserSearchResponse,
} from "../services/userSearchService";

export const useUserSearch = (
  filters: UserSearchFilters,
  enabled: boolean = true
) => {
  return useQuery<UserSearchResponse, Error>({
    queryKey: ["users", "search", filters],
    queryFn: () => userSearchService.searchUsers(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUserSearchSuggestions = (
  searchTerm: string,
  limit: number = 8
) => {
  return useQuery<string[], Error>({
    queryKey: ["users", "search-suggestions", searchTerm, limit],
    queryFn: () =>
      userSearchService.getUserSearchSuggestions(searchTerm, limit),
    enabled: searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
