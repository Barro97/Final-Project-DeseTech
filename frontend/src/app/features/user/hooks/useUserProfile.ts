"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { profileService } from "@/app/features/profile/services/profileService";
import { ProfileData } from "@/app/features/profile/types/profileTypes";

export const useUserProfile = () => {
  const { user, token } = useAuth();
  const userId = user?.id;

  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery<ProfileData, Error>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId || !token) {
        throw new Error("User not authenticated");
      }
      return await profileService.getProfile(userId, token);
    },
    enabled: !!userId && !!token, // Only run the query if userId and token are available
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    retry: 1, // Retry once on failure
  });

  return { profileData, isLoading, error };
};
