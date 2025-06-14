"use client";
import React from "react";
import { Card } from "@/app/components/molecules/card";
import { Calendar, Database, Shield } from "lucide-react";
import Link from "next/link";

interface UserCardProps {
  user: {
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
  };
  showSelectionCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (userId: number) => void;
}

export function UserCard({
  user,
  showSelectionCheckbox = false,
  isSelected = false,
  onSelect,
}: UserCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "moderator":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getCompletenessColor = (completeness: string) => {
    switch (completeness.toLowerCase()) {
      case "complete":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "basic":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200 relative group">
      {showSelectionCheckbox && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(user.user_id)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:checked:bg-blue-500"
          />
        </div>
      )}

      <Link href={`/profile/${user.user_id}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={user.full_name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {user.full_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                @{user.username}
              </p>
              {user.organization && (
                <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                  {user.organization}
                </p>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            {user.role_name && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role_name)}`}
              >
                <Shield className="h-3 w-3 inline mr-1" />
                {user.role_name.charAt(0).toUpperCase() +
                  user.role_name.slice(1)}
              </span>
            )}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletenessColor(user.profile_completeness)}`}
            >
              {user.profile_completeness.charAt(0).toUpperCase() +
                user.profile_completeness.slice(1)}{" "}
              Profile
            </span>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Skills */}
        {user.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {user.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs px-2 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  +{user.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Database className="h-4 w-4" />
            <span>{user.dataset_count} datasets</span>
          </div>
          {user.last_activity && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>Last active: {formatDate(user.last_activity)}</span>
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
