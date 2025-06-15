"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { profileService } from "@/app/features/profile/services/profileService";
import { User, Users } from "lucide-react";

interface OwnersProfileProps {
  ownerIds: number[];
  className?: string;
}

/**
 * OwnersProfile Component
 *
 * Displays dataset owners with profile pictures and navigation.
 * Fetches profile data for each owner and provides clickable navigation to their profile pages.
 */
export const OwnersProfile: React.FC<OwnersProfileProps> = ({
  ownerIds,
  className = "",
}) => {
  const router = useRouter();

  // Fetch owner profiles data
  const {
    data: ownerProfiles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ownerProfiles", ownerIds],
    queryFn: async () => {
      if (!ownerIds || ownerIds.length === 0) return [];

      // Fetch all owner profiles
      const profiles = await Promise.allSettled(
        ownerIds.map((id) => profileService.getProfile(id.toString()))
      );

      // Filter successful results and include the user ID
      return profiles
        .map((result, index) => ({
          userId: ownerIds[index],
          profile: result.status === "fulfilled" ? result.value : null,
        }))
        .filter(
          (
            item
          ): item is {
            userId: number;
            profile: NonNullable<typeof item.profile>;
          } => item.profile !== null
        );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
    enabled: ownerIds && ownerIds.length > 0, // Only run if there are owner IDs
  });

  const handleProfileClick = (userId: number) => {
    router.push(`/profile/${userId}`);
  };

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't render if no owners
  if (!ownerIds || ownerIds.length === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
          <Users className="w-5 h-5 mr-2" />
          <span className="font-medium">Dataset Owners:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {ownerIds.map((_, index) => (
            <div key={index} className="flex items-center py-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 w-24"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state or no successful profiles - fallback to basic display
  if (error || !ownerProfiles || ownerProfiles.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
          <Users className="w-5 h-5 mr-2" />
          <span className="font-medium">Dataset Owners:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ownerIds.map((ownerId) => (
            <div
              key={ownerId}
              className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
            >
              <User className="w-4 h-4 mr-1" />
              <span>User #{ownerId}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
        <Users className="w-5 h-5 mr-2" />
        <span className="font-medium">Dataset Owners:</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {ownerProfiles.map(({ userId, profile }) => (
          <button
            key={userId}
            onClick={() => handleProfileClick(userId)}
            className="flex items-center group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-all duration-200 hover:shadow-md"
            aria-label={`View ${profile.fullName}'s profile`}
          >
            {/* Profile Picture */}
            <div className="relative mr-3 flex-shrink-0">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={`${profile.fullName}'s profile`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all">
                  {getUserInitials(profile.fullName)}
                </div>
              )}
            </div>

            {/* User Information */}
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {profile.fullName}
              </span>
              {profile.organization && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {profile.organization}
                </span>
              )}
            </div>

            {/* Hover indicator */}
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
