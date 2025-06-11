/**
 * Profile Service - API Client for Profile Operations
 *
 * This service handles all API communication related to user profiles,
 * providing methods for fetching and updating profile data. It integrates
 * with the backend profile endpoints and transforms data as needed.
 *
 * FEATURES:
 * - Profile data fetching with privacy support
 * - Profile updates with optimistic UI updates
 * - Error handling and type safety
 * - Integration with auth context
 */

import {
  ProfileData,
  ProfileResponse,
  ProfileUpdateRequest,
} from "../types/profileTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ProfileService {
  /**
   * Get user profile data with privacy filtering.
   *
   * Fetches complete profile information, applying privacy rules based on
   * the viewer's relationship to the profile owner.
   *
   * @param userId - ID of the user whose profile to fetch
   * @param token - Authentication token (optional for public profiles)
   * @returns Promise resolving to ProfileData
   */
  async getProfile(userId: string, token?: string): Promise<ProfileData> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      } else if (response.status === 403) {
        throw new Error("Profile is private");
      } else if (response.status === 401) {
        throw new Error("Authentication required to view this profile");
      } else {
        throw new Error("Failed to fetch profile");
      }
    }

    const profileResponse: ProfileResponse = await response.json();

    // Transform backend response to frontend ProfileData format
    return this.transformProfileResponse(profileResponse);
  }

  /**
   * Get public profile data without authentication.
   *
   * Fetches only publicly available profile information.
   * Useful for anonymous browsing of researcher profiles.
   *
   * @param userId - ID of the user whose profile to fetch
   * @returns Promise resolving to ProfileData
   */
  async getPublicProfile(userId: string): Promise<ProfileData> {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/profile/public`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      } else if (response.status === 403) {
        throw new Error("Profile is not public");
      } else {
        throw new Error("Failed to fetch public profile");
      }
    }

    const profileResponse: ProfileResponse = await response.json();
    return this.transformProfileResponse(profileResponse);
  }

  /**
   * Update user profile data.
   *
   * Updates profile information for the authenticated user.
   * Only the profile owner can update their profile.
   *
   * @param userId - ID of the user whose profile to update
   * @param profileData - Updated profile data
   * @param token - Authentication token
   * @returns Promise resolving to updated ProfileData
   */
  async updateProfile(
    userId: string,
    profileData: Partial<ProfileData>,
    token: string
  ): Promise<ProfileData> {
    // Transform frontend ProfileData to backend format
    const updatePayload = this.transformProfileDataForUpdate(profileData);

    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Profile not found");
      } else if (response.status === 403) {
        throw new Error("Not authorized to update this profile");
      } else if (response.status === 401) {
        throw new Error("Authentication required");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }
    }

    const profileResponse: ProfileResponse = await response.json();
    return this.transformProfileResponse(profileResponse);
  }

  /**
   * Transform backend profile response to frontend ProfileData format.
   *
   * Converts the backend ProfileResponse schema to the frontend ProfileData
   * interface, handling any field name differences and data formatting.
   *
   * @param profileResponse - Backend profile response
   * @returns ProfileData formatted for frontend use
   */
  private transformProfileResponse(
    profileResponse: ProfileResponse
  ): ProfileData {
    return {
      fullName: profileResponse.fullName,
      title: profileResponse.title || "",
      bio: profileResponse.bio || "",
      aboutMe: profileResponse.aboutMe || "",
      skills: profileResponse.skills || [],
      projects: profileResponse.projects || [],
      contact: {
        email: profileResponse.contact?.email || "",
        linkedin: profileResponse.contact?.linkedin || "",
        twitter: profileResponse.contact?.twitter || "",
        orcid: profileResponse.contact?.orcid || "",
      },
      profilePictureUrl: profileResponse.profilePictureUrl,
      coverPhotoUrl: profileResponse.coverPhotoUrl,
      // Additional metadata that might be useful
      userId: profileResponse.user_id,
      username: profileResponse.username,
      privacyLevel: profileResponse.privacy_level,
      profileCompletionPercentage:
        profileResponse.profile_completion_percentage,
      isOwnProfile: profileResponse.is_own_profile,
    };
  }

  /**
   * Transform frontend ProfileData to backend update format.
   *
   * Converts frontend ProfileData structure to the backend ProfileUpdateRequest
   * schema, handling field name mapping and data formatting.
   *
   * @param profileData - Frontend profile data
   * @returns Object formatted for backend API
   */
  private transformProfileDataForUpdate(
    profileData: Partial<ProfileData>
  ): ProfileUpdateRequest {
    const updatePayload: ProfileUpdateRequest = {};

    if (profileData.title !== undefined) {
      updatePayload.title = profileData.title;
    }
    if (profileData.bio !== undefined) {
      updatePayload.bio = profileData.bio;
    }
    if (profileData.aboutMe !== undefined) {
      updatePayload.aboutMe = profileData.aboutMe;
    }
    if (profileData.coverPhotoUrl !== undefined) {
      updatePayload.coverPhotoUrl = profileData.coverPhotoUrl;
    }
    if (profileData.skills !== undefined) {
      updatePayload.skills = profileData.skills;
    }
    if (profileData.projects !== undefined) {
      updatePayload.projects = profileData.projects;
    }
    if (profileData.contact !== undefined) {
      updatePayload.contact = profileData.contact;
    }

    return updatePayload;
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService;
