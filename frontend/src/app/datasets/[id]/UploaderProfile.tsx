"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { profileService } from "@/app/features/profile/services/profileService";
import { User } from "lucide-react";

interface UploaderProfileProps {
  uploaderId: number;
  className?: string;
}

/**
 * UploaderProfile Component
 *
 * Displays uploader information with profile picture and navigation.
 * Fetches profile data and provides clickable navigation to user's profile page.
 */
export const UploaderProfile: React.FC<UploaderProfileProps> = ({
  uploaderId,
  className = "",
}) => {
  const router = useRouter();

  // Fetch uploader profile data
  const {
    data: uploaderProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["uploaderProfile", uploaderId],
    queryFn: () => profileService.getProfile(uploaderId.toString()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
  });

  const handleProfileClick = () => {
    router.push(`/profile/${uploaderId}`);
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

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-3"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state - fallback to basic display
  if (error || !uploaderProfile) {
    return (
      <div
        className={`flex items-center text-gray-600 dark:text-gray-300 ${className}`}
      >
        <User className="w-5 h-5 mr-2" />
        <span>Uploaded by: User #{uploaderId}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleProfileClick}
      className={`flex items-center group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-all duration-200 hover:shadow-sm ${className}`}
      aria-label={`View ${uploaderProfile.fullName}'s profile`}
    >
      {/* Profile Picture */}
      <div className="relative mr-3 flex-shrink-0">
        {uploaderProfile.profilePictureUrl ? (
          <img
            src={uploaderProfile.profilePictureUrl}
            alt={`${uploaderProfile.fullName}'s profile`}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all">
            {getUserInitials(uploaderProfile.fullName)}
          </div>
        )}
      </div>

      {/* User Information */}
      <div className="flex flex-col items-start text-left">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {uploaderProfile.fullName}
          </span>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span>Uploaded by</span>
          {uploaderProfile.organization && (
            <>
              <span className="mx-1">•</span>
              <span className="text-blue-600 dark:text-blue-400">
                {uploaderProfile.organization}
              </span>
            </>
          )}
        </div>
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
  );
};
