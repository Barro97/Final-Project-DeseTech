import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  ProfileData,
  ProfileUpdateData,
  getUserProfile,
  getMyProfile,
  updateProfile,
} from "../services/profileService";

export const useProfile = (userId?: number) => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if this is the current user's profile
  const isOwnProfile = userId ? userId === parseInt(user?.id || "0") : true;
  const targetUserId = userId || parseInt(user?.id || "0");

  const fetchProfile = async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      let profileData: ProfileData;

      if (isOwnProfile && token) {
        // Get own profile with full access
        profileData = await getMyProfile(token);
      } else {
        // Get other user's profile with privacy filtering
        profileData = await getUserProfile(targetUserId, token || undefined);
      }

      setProfile(profileData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail || "Failed to load profile";
      setError(errorMessage);
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profileData: ProfileUpdateData) => {
    if (!token || !isOwnProfile) {
      throw new Error(
        "Cannot update profile: not authenticated or not own profile"
      );
    }

    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await updateProfile(profileData, token);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail || "Failed to update profile";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile when component mounts or dependencies change
  useEffect(() => {
    fetchProfile();
  }, [targetUserId, token]);

  return {
    profile,
    loading,
    error,
    isOwnProfile,
    fetchProfile,
    updateProfile: updateUserProfile,
    refetch: fetchProfile,
  };
};
