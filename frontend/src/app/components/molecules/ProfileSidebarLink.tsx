"use client";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/atoms/avatar";
import { Skeleton } from "@/app/components/atoms/skeleton";
import { User } from "lucide-react";

interface ProfileSidebarLinkProps {
  userId?: string;
  fullName?: string;
  profilePictureUrl?: string;
  isLoading: boolean;
}

const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function ProfileSidebarLink({
  userId,
  fullName,
  profilePictureUrl,
  isLoading,
}: ProfileSidebarLinkProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-md p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!userId || !fullName) {
    // Fallback to a generic profile link if data is not available
    return (
      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <User className="h-6 w-6" />
        <span>Profile</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/profile/${userId}`}
      className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={profilePictureUrl} alt={fullName} />
        <AvatarFallback>{getUserInitials(fullName)}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-sm">{fullName}</span>
    </Link>
  );
}
