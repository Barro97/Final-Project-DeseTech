"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { profileService } from "@/app/features/profile/services/profileService";
import { Users, Crown, UserCheck } from "lucide-react";

interface DatasetPeopleProps {
  uploaderId: number;
  ownerIds: number[];
  className?: string;
}

interface PersonProfile {
  userId: number;
  profile: {
    fullName: string;
    profilePictureUrl?: string;
    organization?: string;
  } | null;
  role: "creator" | "owner";
}

/**
 * DatasetPeople Component
 *
 * Displays all people associated with a dataset (uploader + owners) in a unified section.
 * Eliminates duplication by showing the uploader as "Creator" and additional owners as "Owners".
 * All profiles are clickable and navigate to user profile pages.
 */
export const DatasetPeople: React.FC<DatasetPeopleProps> = ({
  uploaderId,
  ownerIds,
  className = "",
}) => {
  const router = useRouter();

  // Fetch all people profiles
  const {
    data: people,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["datasetPeople", uploaderId, ownerIds],
    queryFn: async () => {
      // Deduplicate: remove uploader from owners list if present
      const additionalOwnerIds = ownerIds.filter((id) => id !== uploaderId);

      // Create list of all people to fetch
      const peopleToFetch: PersonProfile[] = [
        { userId: uploaderId, profile: null, role: "creator" },
        ...additionalOwnerIds.map((id) => ({
          userId: id,
          profile: null,
          role: "owner" as const,
        })),
      ];

      // Fetch all profiles in parallel
      const profilePromises = peopleToFetch.map(async (person) => {
        try {
          const profile = await profileService.getProfile(
            person.userId.toString()
          );
          return { ...person, profile };
        } catch (error) {
          console.error(
            `Failed to fetch profile for user ${person.userId}:`,
            error
          );
          return { ...person, profile: null };
        }
      });

      const results = await Promise.allSettled(profilePromises);

      return results
        .map((result, index) =>
          result.status === "fulfilled"
            ? result.value
            : { ...peopleToFetch[index], profile: null }
        )
        .filter((person) => person !== null);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
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

  // Helper function to get role badge
  const getRoleBadge = (role: "creator" | "owner") => {
    if (role === "creator") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
          <Crown className="h-3 w-3" />
          Creator
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
          <UserCheck className="h-3 w-3" />
          Owner
        </span>
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
          <Users className="w-5 h-5 mr-2" />
          <span className="font-medium">Dataset Contributors</span>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Creator skeleton */}
          <div className="flex items-center py-2">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-4"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
            </div>
          </div>
          {/* Additional owners skeletons */}
          {ownerIds
            .filter((id) => id !== uploaderId)
            .map((_, index) => (
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

  // Error state or no people
  if (error || !people || people.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
          <Users className="w-5 h-5 mr-2" />
          <span className="font-medium">Dataset Contributors</span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg">
          <Users className="w-5 h-5 mr-2" />
          <span>Uploaded by User #{uploaderId}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
        <Users className="w-5 h-5 mr-2" />
        <span className="font-medium">Dataset Contributors</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {people.map((person) => {
          const isCreator = person.role === "creator";
          const avatarSize = isCreator ? "w-12 h-12" : "w-10 h-10";

          return (
            <button
              key={person.userId}
              onClick={() => handleProfileClick(person.userId)}
              className="flex items-center group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 -m-3 transition-all duration-200 hover:shadow-md"
              aria-label={`View ${person.profile?.fullName || `User ${person.userId}`}'s profile`}
            >
              {/* Profile Picture */}
              <div className="relative mr-4 flex-shrink-0">
                {person.profile?.profilePictureUrl ? (
                  <img
                    src={person.profile.profilePictureUrl}
                    alt={`${person.profile.fullName}'s profile`}
                    className={`${avatarSize} rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all`}
                  />
                ) : (
                  <div
                    className={`${avatarSize} rounded-full ${isCreator ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-green-500 to-teal-600"} flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-600 transition-all`}
                  >
                    {person.profile
                      ? getUserInitials(person.profile.fullName)
                      : "U"}
                  </div>
                )}
              </div>

              {/* User Information */}
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`${isCreator ? "text-base" : "text-sm"} font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}
                  >
                    {person.profile?.fullName || `User #${person.userId}`}
                  </span>
                  {getRoleBadge(person.role)}
                </div>

                {person.profile?.organization && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {person.profile.organization}
                  </span>
                )}
              </div>

              {/* Hover indicator */}
              <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-500"
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
        })}
      </div>
    </div>
  );
};
