import axios from "axios";

// Types for profile data - simplified for now, we'll expand later
export interface ProfileData {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile?: {
    bio?: string;
    about_me?: string;
    title?: string;
    privacy_level?: string;
  };
}

export interface ProfileUpdateData {
  profile?: {
    bio?: string;
    about_me?: string;
    title?: string;
    privacy_level?: string;
  };
  skills?: Array<{
    skill_name: string;
    category?: string;
    is_visible?: boolean;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    link?: string;
    is_visible?: boolean;
  }>;
  contact?: {
    linkedin?: string;
    twitter?: string;
    orcid?: string;
    personal_email?: string;
    show_email?: boolean;
    show_linkedin?: boolean;
    show_twitter?: boolean;
    show_orcid?: boolean;
  };
}

/**
 * Get a user's profile by ID
 */
export async function getUserProfile(
  userId: number,
  token?: string
): Promise<ProfileData> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND}/users/${userId}/profile`,
    { headers }
  );

  return response.data;
}

/**
 * Get the current user's profile
 */
export async function getMyProfile(token: string): Promise<ProfileData> {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND}/users/me/profile`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  profileData: ProfileUpdateData,
  token: string
): Promise<ProfileData> {
  const response = await axios.put(
    `${process.env.NEXT_PUBLIC_BACKEND}/users/me/profile`,
    profileData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
}
