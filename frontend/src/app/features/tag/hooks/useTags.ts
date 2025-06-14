import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllTags,
  getUsedTags,
  createTag,
  updateTag,
  deleteTag,
  getTagById,
} from "../services/tagService";
import {
  Tag,
  TagCreate,
  TagUpdate,
  TagList,
  TagDeleteResponse,
} from "../types/tagTypes";

/**
 * Custom hook for fetching all tags
 * Used in dropdowns and admin management
 */
export function useTags() {
  return useQuery<TagList, Error>({
    queryKey: ["tags"],
    queryFn: getAllTags,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Custom hook for fetching only tags that are associated with datasets
 * Used in filtering interfaces to avoid showing tags that would return empty results
 */
export function useUsedTags() {
  return useQuery<TagList, Error>({
    queryKey: ["tags", "used"],
    queryFn: getUsedTags,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Custom hook for fetching a single tag by ID
 */
export function useTag(tagId: number | null) {
  return useQuery<Tag, Error>({
    queryKey: ["tag", tagId],
    queryFn: () => getTagById(tagId!),
    enabled: !!tagId,
  });
}

/**
 * Custom hook for tag mutations (create, update, delete)
 * Includes proper cache invalidation and error handling
 */
export function useTagMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation<Tag, Error, TagCreate>({
    mutationFn: createTag,
    onSuccess: () => {
      // Invalidate and refetch tags list
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const updateMutation = useMutation<
    Tag,
    Error,
    { tagId: number; tagData: TagUpdate }
  >({
    mutationFn: ({ tagId, tagData }) => updateTag(tagId, tagData),
    onSuccess: (data) => {
      // Invalidate tags list and specific tag
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tag", data.tag_id] });
    },
  });

  const deleteMutation = useMutation<TagDeleteResponse, Error, number>({
    mutationFn: deleteTag,
    onSuccess: () => {
      // Invalidate tags list
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  return {
    createTag: createMutation,
    updateTag: updateMutation,
    deleteTag: deleteMutation,
  };
}

/**
 * Custom hook for tag selection state management
 * Used in dataset upload/edit forms
 */
export function useTagSelection(initialTags: string[] = []) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const addTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const removeTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagName));
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      removeTag(tagName);
    } else {
      addTag(tagName);
    }
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  return {
    selectedTags,
    setSelectedTags,
    addTag,
    removeTag,
    toggleTag,
    clearTags,
  };
}
