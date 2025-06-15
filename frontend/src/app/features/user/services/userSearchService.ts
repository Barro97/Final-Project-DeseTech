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
  about_me?: string;
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

/**
 * Get a user by their ID
 */
export async function getUserById(userId: number): Promise<UserSearchResponse> {
  const response = await fetch(`${config.BACKEND_URL}/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.statusText}`);
  }

  const userData = await response.json();

  // Convert the backend user response to UserSearchResponse format
  return {
    user_id: userData.user_id,
    username: userData.username,
    full_name:
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
      userData.username,
    email: userData.email,
    role_name: userData.role?.role_name,
    status: userData.status || "active",
    organization: userData.organization,
    bio: userData.bio,
    about_me: userData.about_me,
    profile_picture_url: userData.profile_picture,
    dataset_count: 0, // Will be filled by backend if needed
    profile_completeness: "basic", // Default value
    last_activity: userData.last_login,
    skills: [],
    is_verified: false,
  };
}

/**
 * Get multiple users by their IDs
 */
export async function getUsersByIds(
  userIds: number[]
): Promise<UserSearchResponse[]> {
  if (userIds.length === 0) {
    return [];
  }

  try {
    // Get users in parallel
    const userPromises = userIds.map(getUserById);
    const users = await Promise.all(userPromises);
    return users;
  } catch (error) {
    console.error("Error getting users by IDs:", error);
    // Return empty array on error to gracefully degrade
    return [];
  }
}
