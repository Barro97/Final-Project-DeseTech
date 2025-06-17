"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Tag as TagIcon, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/atoms/button";
import { Input } from "@/app/components/atoms/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/atoms/dialog";
import { useTags, useTagMutations } from "../hooks/useTags";
import { TagCreate, TagUpdate } from "../types/tagTypes";

interface TagFormData {
  tag_category_name: string;
}

export function AdminTagManagement() {
  const { data: tagsData, isLoading, error } = useTags();
  const { createTag, updateTag, deleteTag } = useTagMutations();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<{
    tag_id: number;
    tag_category_name: string;
  } | null>(null);

  const [formData, setFormData] = useState<TagFormData>({
    tag_category_name: "",
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const tags = tagsData?.tags || [];

  const validateForm = (data: TagFormData): boolean => {
    const errors: { [key: string]: string } = {};

    if (!data.tag_category_name.trim()) {
      errors.tag_category_name = "Tag name is required";
    } else if (data.tag_category_name.trim().length < 2) {
      errors.tag_category_name = "Tag name must be at least 2 characters";
    } else if (data.tag_category_name.trim().length > 50) {
      errors.tag_category_name = "Tag name must be less than 50 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTag = async () => {
    if (!validateForm(formData)) return;

    const tagData: TagCreate = {
      tag_category_name: formData.tag_category_name.trim().toLowerCase(),
    };

    try {
      await createTag.mutateAsync(tagData);
      setIsCreateDialogOpen(false);
      setFormData({ tag_category_name: "" });
      setFormErrors({});
    } catch (error) {
      console.error("Error creating tag:", error);
      setFormErrors({
        submit: "Failed to create tag. Please try again.",
      });
    }
  };

  const handleEditTag = async () => {
    if (!selectedTag || !validateForm(formData)) return;

    const tagData: TagUpdate = {
      tag_category_name: formData.tag_category_name.trim().toLowerCase(),
    };

    try {
      await updateTag.mutateAsync({
        tagId: selectedTag.tag_id,
        tagData,
      });
      setIsEditDialogOpen(false);
      setSelectedTag(null);
      setFormData({ tag_category_name: "" });
      setFormErrors({});
    } catch (error) {
      console.error("Error updating tag:", error);
      setFormErrors({
        submit: "Failed to update tag. Please try again.",
      });
    }
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    try {
      await deleteTag.mutateAsync(selectedTag.tag_id);
      setIsDeleteDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const openEditDialog = (tag: {
    tag_id: number;
    tag_category_name: string;
  }) => {
    setSelectedTag(tag);
    setFormData({ tag_category_name: tag.tag_category_name });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (tag: {
    tag_id: number;
    tag_category_name: string;
  }) => {
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">
            Error Loading Tags
          </h3>
        </div>
        <p className="text-red-700">
          Unable to load tags. Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tag Management</h2>
          <p className="text-gray-600 mt-1">
            Create and manage tags for dataset categorization
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent
            className="!bg-background !bg-opacity-100"
            style={{
              opacity: 1,
              backgroundColor: "var(--background)",
              backdropFilter: "none",
            }}
          >
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tag Name
                </label>
                <Input
                  value={formData.tag_category_name}
                  onChange={(e) =>
                    setFormData({ tag_category_name: e.target.value })
                  }
                  placeholder="Enter tag name..."
                  className={
                    formErrors.tag_category_name ? "border-red-500" : ""
                  }
                />
                {formErrors.tag_category_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.tag_category_name}
                  </p>
                )}
              </div>

              {formErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {formErrors.submit}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({ tag_category_name: "" });
                    setFormErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTag}
                  disabled={createTag.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createTag.isPending ? "Creating..." : "Create Tag"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold">
            All Tags ({isLoading ? "..." : tags.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tags...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center">
            <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              No Tags Found
            </h4>
            <p className="text-gray-500 mb-4">
              Get started by creating your first tag for dataset categorization.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {tags.map((tag) => (
              <div
                key={tag.tag_id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <TagIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">{tag.tag_category_name}</h4>
                    <p className="text-sm text-gray-500">ID: {tag.tag_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(tag)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="!bg-background !bg-opacity-100"
          style={{
            opacity: 1,
            backgroundColor: "var(--background)",
            backdropFilter: "none",
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tag Name</label>
              <Input
                value={formData.tag_category_name}
                onChange={(e) =>
                  setFormData({ tag_category_name: e.target.value })
                }
                placeholder="Enter tag name..."
                className={formErrors.tag_category_name ? "border-red-500" : ""}
              />
              {formErrors.tag_category_name && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.tag_category_name}
                </p>
              )}
            </div>

            {formErrors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {formErrors.submit}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTag(null);
                  setFormData({ tag_category_name: "" });
                  setFormErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTag}
                disabled={updateTag.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateTag.isPending ? "Updating..." : "Update Tag"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent
          className="!bg-background !bg-opacity-100"
          style={{
            opacity: 1,
            backgroundColor: "var(--background)",
            backdropFilter: "none",
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">
                  Are you sure you want to delete this tag?
                </h4>
                <p className="text-sm text-red-700">
                  Tag &ldquo;<strong>{selectedTag?.tag_category_name}</strong>
                  &rdquo; will be permanently deleted and removed from all
                  datasets. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedTag(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTag}
                disabled={deleteTag.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteTag.isPending ? "Deleting..." : "Delete Tag"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
