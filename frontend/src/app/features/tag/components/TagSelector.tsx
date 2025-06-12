"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Tag, ChevronDown, Check } from "lucide-react";
import { Button } from "@/app/components/atoms/button";
import { useTags } from "../hooks/useTags";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  placeholder = "Select tags...",
  disabled = false,
  className = "",
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: tagsData, isLoading, error } = useTags();

  const availableTags = tagsData?.tags || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      // Remove tag
      onTagsChange(selectedTags.filter((tag) => tag !== tagName));
    } else {
      // Add tag
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const handleRemoveTag = (tagName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent dropdown from opening
    onTagsChange(selectedTags.filter((tag) => tag !== tagName));
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (error) {
    return (
      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
        Error loading tags. Please try again later.
      </div>
    );
  }

  return (
    <div className={`space-y-2 relative ${className}`} ref={dropdownRef}>
      {/* Main selector button */}
      <Button
        variant="outline"
        disabled={disabled || isLoading}
        className="w-full justify-between h-auto min-h-[2.5rem] p-3"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 text-left">
          {selectedTags.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 rounded-full text-xs font-medium flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {tag}
                <X
                  className="h-3 w-3 hover:bg-gray-300 rounded-full cursor-pointer"
                  onClick={(e) => handleRemoveTag(tag, e)}
                />
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-50 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <div className="p-2">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading tags...
              </div>
            ) : availableTags.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No tags available. Contact an administrator to create tags.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium">Available Tags</span>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllTags}
                      className="text-xs"
                      type="button"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(
                      tag.tag_category_name
                    );
                    return (
                      <div
                        key={tag.tag_id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-sm"
                        onClick={() => handleTagToggle(tag.tag_category_name)}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {tag.tag_category_name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="text-xs text-gray-600">
          {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""}{" "}
          selected
        </div>
      )}
    </div>
  );
}
