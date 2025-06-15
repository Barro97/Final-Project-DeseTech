"use client";
import React from "react";
import { Card } from "@/app/components/molecules/card";
import { Database, Shield, MapPin, User, CheckCircle } from "lucide-react";
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
    about_me?: string;
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
  const getRoleInfo = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return {
          color:
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
          icon: Shield,
          label: "Admin",
        };
      case "moderator":
        return {
          color:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
          icon: Shield,
          label: "Moderator",
        };
      case "researcher":
        return {
          color:
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
          icon: User,
          label: "Researcher",
        };
      default:
        return {
          color:
            "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700",
          icon: User,
          label: "User",
        };
    }
  };

  const getCompletenessInfo = (completeness: string) => {
    switch (completeness.toLowerCase()) {
      case "complete":
        return {
          color: "bg-emerald-500",
          percentage: 100,
          label: "Complete",
        };
      case "intermediate":
        return {
          color: "bg-amber-500",
          percentage: 75,
          label: "Good",
        };
      case "basic":
        return {
          color: "bg-slate-400",
          percentage: 50,
          label: "Basic",
        };
      default:
        return {
          color: "bg-gray-300",
          percentage: 25,
          label: "Incomplete",
        };
    }
  };

  const roleInfo = getRoleInfo(user.role_name);
  const completenessInfo = getCompletenessInfo(user.profile_completeness);
  const RoleIcon = roleInfo.icon;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900">
      {/* Selection Checkbox */}
      {showSelectionCheckbox && (
        <div className="absolute top-4 left-4 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(user.user_id)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:checked:bg-blue-500"
          />
        </div>
      )}

      {/* Gradient Background Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      <Link href={`/profile/${user.user_id}`} className="block p-4">
        <div className="flex items-center gap-4">
          {/* Profile Picture Section */}
          <div className="relative flex-shrink-0">
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt={user.full_name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-md ring-2 ring-white dark:ring-gray-800">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Verification Badge */}
            {user.is_verified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Main Content Section */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Basic Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {user.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${roleInfo.color} flex-shrink-0`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </span>
                </div>

                {/* Organization */}
                {user.organization && (
                  <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{user.organization}</span>
                  </div>
                )}
              </div>

              {/* Middle Column - Bio & Description */}
              <div className="space-y-2">
                {/* Bio */}
                {user.bio && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-relaxed line-clamp-1">
                      {user.bio}
                    </p>
                  </div>
                )}

                {/* About Me / Description */}
                {user.about_me && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                      {user.about_me}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {user.skills.length > 0 && (
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {user.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                          +{user.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Stats & Profile */}
              <div className="space-y-2">
                {/* Dataset Count */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-center">
                    <Database className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {user.dataset_count} datasets
                    </p>
                  </div>
                </div>

                {/* Profile Completeness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Profile: {completenessInfo.label}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {completenessInfo.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${completenessInfo.color}`}
                      style={{ width: `${completenessInfo.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
