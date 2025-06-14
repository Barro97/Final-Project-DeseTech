import { config } from "@/app/lib/config";

// Types for user search
export interface UserSearchFilters {
  search_term?: string;
  roles?: string[];
  organizations?: string[];
  skills?: string[];
  status?: string[];
  has_datasets?: boolean;
  min_datasets?: number;
  profile_completeness?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
}

export interface UserSearchResponse {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role_name?: string;
  status: string;
  organization?: string;
  bio?: string;
  profile_picture_url?: string;
  dataset_count: number;
  profile_completeness: string;
  last_activity?: string;
  skills: string[];
  is_verified: boolean;
}

export interface UserSearchListResponse {
  users: UserSearchResponse[];
  total_count: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Search users with filters and pagination
 */
export async function searchUsers(
  filters: UserSearchFilters
): Promise<UserSearchListResponse> {
  const params = new URLSearchParams();

  // Add all filter parameters
  if (filters.search_term) params.append("search_term", filters.search_term);
  if (filters.roles) {
    filters.roles.forEach((role) => params.append("roles", role));
  }
  if (filters.organizations) {
    filters.organizations.forEach((org) => params.append("organizations", org));
  }
  if (filters.skills) {
    filters.skills.forEach((skill) => params.append("skills", skill));
  }
  if (filters.status) {
    filters.status.forEach((status) => params.append("status", status));
  }
  if (filters.has_datasets !== undefined) {
    params.append("has_datasets", filters.has_datasets.toString());
  }
  if (filters.min_datasets !== undefined) {
    params.append("min_datasets", filters.min_datasets.toString());
  }
  if (filters.profile_completeness) {
    params.append("profile_completeness", filters.profile_completeness);
  }
  if (filters.sort_by) {
    params.append("sort_by", filters.sort_by);
  }

  params.append("page", (filters.page || 1).toString());
  params.append("limit", (filters.limit || 20).toString());

  const response = await fetch(
    `${config.BACKEND_URL}/users/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search users: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user search suggestions for autocomplete
 */
export async function getUserSearchSuggestions(
  searchTerm: string,
  limit: number = 8
): Promise<string[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    search_term: searchTerm,
    limit: limit.toString(),
  });

  const response = await fetch(
    `${config.BACKEND_URL}/users/search-suggestions?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get user search suggestions: ${response.statusText}`
    );
  }

  return response.json();
}
