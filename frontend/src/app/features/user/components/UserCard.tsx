"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Calendar, Database, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/app/components/molecules/card";

export interface UserSearchResult {
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

interface UserCardProps {
  user: UserSearchResult;
  isSelected?: boolean;
  onSelect?: (userId: number) => void;
  showSelectionCheckbox?: boolean;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  isSelected = false,
  onSelect,
  showSelectionCheckbox = false,
  className = "",
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on links or buttons
    if ((e.target as HTMLElement).closest("a, button")) {
      return;
    }

    if (onSelect) {
      onSelect(user.user_id);
    }
  };

  const getProfileCompletenessColor = (completeness: string) => {
    switch (completeness) {
      case "complete":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "moderator":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "researcher":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return "No recent activity";

    const date = new Date(lastActivity);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Active today";
    if (diffInDays === 1) return "Active yesterday";
    if (diffInDays < 7) return `Active ${diffInDays} days ago`;
    if (diffInDays < 30)
      return `Active ${Math.floor(diffInDays / 7)} weeks ago`;
    return `Active ${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <Card
      className={`
        group relative transition-all duration-200 hover:shadow-lg hover:-translate-y-1 
        border-gray-200 dark:border-gray-700 cursor-pointer
        ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
        ${className}
      `}
      onClick={handleCardClick}
    >
      {showSelectionCheckbox && (
        <div className="absolute top-3 right-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(user.user_id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt={`${user.full_name}'s profile`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${user.user_id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {user.full_name}
              </Link>
              {user.is_verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              @{user.username}
            </p>

            {/* Role and Status Badges */}
            <div className="flex flex-wrap gap-1 mb-2">
              {user.role_name && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role_name)}`}
                >
                  {user.role_name}
                </span>
              )}
              <span
                className={`text-xs px-2 py-1 rounded-full ${getProfileCompletenessColor(user.profile_completeness)}`}
              >
                {user.profile_completeness} profile
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Organization */}
        {user.organization && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{user.organization}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <div className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            <span>
              {user.dataset_count} dataset{user.dataset_count !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">
              {formatLastActivity(user.last_activity)}
            </span>
          </div>
        </div>

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {skill}
              </span>
            ))}
            {user.skills.length > 3 && (
              <span className="text-xs px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                +{user.skills.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Email (if not private) */}
        {user.email && user.email !== "Private" && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
