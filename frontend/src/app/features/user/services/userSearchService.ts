import { UserSearchResult } from "../components/UserCard";

export interface UserSearchFilters {
  search_term?: string;
  roles?: string[];
  organizations?: string[];
  skills?: string[];
  status?: string[];
  has_datasets?: boolean;
  min_datasets?: number;
  profile_completeness?: string;
  sort_by?: "relevance" | "name" | "recent" | "datasets" | "activity";
  page?: number;
  limit?: number;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  total_count: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

class UserSearchService {
  private baseUrl = `${process.env.NEXT_PUBLIC_BACKEND}/users`;

  async searchUsers(
    filters: UserSearchFilters = {}
  ): Promise<UserSearchResponse> {
    const params = new URLSearchParams();

    // Add all filter parameters to the URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(
      `${this.baseUrl}/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Include auth token if available
          ...this.getAuthHeaders(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserSearchSuggestions(
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
      `${this.baseUrl}/search-suggestions?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Include auth token if available
          ...this.getAuthHeaders(),
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

  private getAuthHeaders(): Record<string, string> {
    // Get token from sessionStorage to match dataset service pattern
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }
}

export const userSearchService = new UserSearchService();
