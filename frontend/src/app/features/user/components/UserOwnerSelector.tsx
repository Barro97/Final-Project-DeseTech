"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/app/components/atoms/button";
import { Input } from "@/app/components/atoms/input";
import { searchUsers, UserSearchResponse } from "../services/userSearchService";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";

// Simplified user interface for the selector
export interface UserOwner {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  organization?: string;
}

interface UserOwnerSelectorProps {
  selectedOwners: UserOwner[];
  onOwnersChange: (owners: UserOwner[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  excludeCurrentUser?: boolean;
  uploaderId?: number; // ID of the original uploader who cannot be removed
}

export function UserOwnerSelector({
  selectedOwners,
  onOwnersChange,
  placeholder = "Add dataset owners...",
  disabled = false,
  className = "",
  excludeCurrentUser = true,
  uploaderId,
}: UserOwnerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (term: string) => {
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await searchUsers({
          search_term: term,
          limit: 10,
          status: ["active"], // Only show active users
        });

        let filteredUsers = response.users;

        // Filter out current user if excludeCurrentUser is true
        if (excludeCurrentUser && user?.id) {
          filteredUsers = filteredUsers.filter(
            (u) => u.user_id !== parseInt(user.id)
          );
        }

        // Filter out already selected owners
        filteredUsers = filteredUsers.filter(
          (u) => !selectedOwners.some((owner) => owner.user_id === u.user_id)
        );

        setSearchResults(filteredUsers);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchError("Failed to search users. Please try again.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedOwners, excludeCurrentUser, user?.id]
  );

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debouncedSearch]);

  const handleOwnerToggle = (userSearchResponse: UserSearchResponse) => {
    const userOwner: UserOwner = {
      user_id: userSearchResponse.user_id,
      username: userSearchResponse.username,
      full_name: userSearchResponse.full_name,
      profile_picture_url: userSearchResponse.profile_picture_url,
      organization: userSearchResponse.organization,
    };

    if (selectedOwners.some((owner) => owner.user_id === userOwner.user_id)) {
      // Remove owner
      onOwnersChange(
        selectedOwners.filter((owner) => owner.user_id !== userOwner.user_id)
      );
    } else {
      // Add owner
      onOwnersChange([...selectedOwners, userOwner]);
    }

    // Clear search after selection
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleRemoveOwner = (userOwner: UserOwner, event: React.MouseEvent) => {
    event.stopPropagation();

    // Prevent removing the original uploader
    if (uploaderId && userOwner.user_id === uploaderId) {
      return;
    }

    onOwnersChange(
      selectedOwners.filter((owner) => owner.user_id !== userOwner.user_id)
    );
  };

  const clearAllOwners = () => {
    // Keep the original uploader if they are in the list
    if (uploaderId) {
      const uploaderOwner = selectedOwners.find(
        (owner) => owner.user_id === uploaderId
      );
      onOwnersChange(uploaderOwner ? [uploaderOwner] : []);
    } else {
      onOwnersChange([]);
    }
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

  return (
    <div className={`space-y-2 relative ${className}`} ref={dropdownRef}>
      {/* Main selector button */}
      <div
        className={`w-full justify-between h-auto min-h-[2.5rem] p-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors flex items-center ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 text-left">
          {selectedOwners.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedOwners.map((owner) => (
              <span
                key={owner.user_id}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 rounded-full text-xs font-medium flex items-center gap-1.5"
              >
                {/* User avatar */}
                {owner.profile_picture_url ? (
                  <img
                    src={owner.profile_picture_url}
                    alt={`${owner.full_name}'s avatar`}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                    {getUserInitials(owner.full_name)}
                  </div>
                )}
                <span className="max-w-[120px] truncate">
                  {owner.full_name}
                </span>
                {/* Only show X button if this is not the original uploader */}
                {(!uploaderId || owner.user_id !== uploaderId) && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveOwner(owner, e)}
                    className="h-4 w-4 hover:bg-red-200 dark:hover:bg-red-800 rounded-full cursor-pointer flex-shrink-0 flex items-center justify-center transition-colors"
                    aria-label={`Remove ${owner.full_name} as owner`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-50 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <div className="p-3">
            {/* Search input */}
            <div className="mb-3">
              <Input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for users..."
                className="w-full"
              />
            </div>

            {/* Header with clear all button */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600 mb-2">
              <span className="text-sm font-medium">Add Owners</span>
              {selectedOwners.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllOwners}
                  className="text-xs"
                  type="button"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Search results */}
            <div className="max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center p-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">
                    Searching...
                  </span>
                </div>
              ) : searchError ? (
                <div className="p-4 text-center text-sm text-red-600">
                  {searchError}
                </div>
              ) : searchTerm.length < 2 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Type at least 2 characters to search for users
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No users found matching &quot;{searchTerm}&quot;
                </div>
              ) : (
                searchResults.map((userResult) => {
                  const isSelected = selectedOwners.some(
                    (owner) => owner.user_id === userResult.user_id
                  );
                  return (
                    <div
                      key={userResult.user_id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-sm"
                      onClick={() => handleOwnerToggle(userResult)}
                    >
                      <div className="flex items-center gap-3">
                        {/* User avatar */}
                        {userResult.profile_picture_url ? (
                          <img
                            src={userResult.profile_picture_url}
                            alt={`${userResult.full_name}'s avatar`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {getUserInitials(userResult.full_name)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {userResult.full_name}
                          </span>
                          {userResult.organization && (
                            <span className="text-xs text-gray-500">
                              {userResult.organization}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected owners count */}
      {selectedOwners.length > 0 && (
        <div className="text-xs text-gray-600">
          {selectedOwners.length} owner{selectedOwners.length !== 1 ? "s" : ""}{" "}
          selected
        </div>
      )}
    </div>
  );
}
