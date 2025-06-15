"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogDescription,
} from "@/app/components/atoms/dialog";
import {
  Dataset,
  DatasetFile,
} from "@/app/features/dataset/types/datasetTypes";
import { Button } from "@/app/components/atoms/button";
import { FileText, X } from "lucide-react";
import {
  updateDataset,
  deleteDatasetFile,
  uploadFileToDataset,
  addDatasetOwner,
  removeDatasetOwner,
} from "@/app/features/dataset/services/datasetService";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { FileUpload } from "@/app/features/upload/components/organisms/FileUpload";
import { FileItem } from "@/app/features/upload/types/file";
import { TagSelector } from "@/app/features/tag/components/TagSelector";
import {
  UserOwnerSelector,
  UserOwner,
} from "@/app/features/user/components/UserOwnerSelector";
import { getUsersByIds } from "@/app/features/user/services/userSearchService";
import "./editDatasetStyles.css";

interface EditDatasetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset;
  files: DatasetFile[];
  datasetId: string;
}

export function EditDatasetDialog({
  isOpen,
  onClose,
  dataset,
  files,
  datasetId,
}: EditDatasetDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState(dataset.dataset_name);
  const [description, setDescription] = useState(
    dataset.dataset_description || ""
  );
  const [geographicLocation, setGeographicLocation] = useState(
    dataset.geographic_location || ""
  );
  const [dataTimePeriod, setDataTimePeriod] = useState(
    dataset.data_time_period || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFiles, setNewFiles] = useState<FileItem[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<UserOwner[]>([]);
  const [originalOwners, setOriginalOwners] = useState<number[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  // Reset form when dialog opens (to fix the visual bug)
  useEffect(() => {
    if (isOpen) {
      setName(dataset.dataset_name);
      setDescription(dataset.dataset_description || "");
      setGeographicLocation(dataset.geographic_location || "");
      setDataTimePeriod(dataset.data_time_period || "");
      setSelectedTags(dataset.tags || []);
      setNewFiles([]);
      setFilesToDelete([]);
      setOriginalOwners(dataset.owners || []);

      // Load owner details
      if (dataset.owners && dataset.owners.length > 0) {
        setIsLoadingOwners(true);
        getUsersByIds(dataset.owners)
          .then((ownerDetails) => {
            const userOwners: UserOwner[] = ownerDetails.map((user) => ({
              user_id: user.user_id,
              username: user.username,
              full_name: user.full_name,
              profile_picture_url: user.profile_picture_url,
              organization: user.organization,
            }));
            setSelectedOwners(userOwners);
          })
          .catch((error) => {
            console.error("Error loading owner details:", error);
            setSelectedOwners([]);
          })
          .finally(() => {
            setIsLoadingOwners(false);
          });
      } else {
        setSelectedOwners([]);
      }
    }
  }, [isOpen, dataset]);

  const handleToggleFileToDelete = (fileId: number) => {
    if (filesToDelete.includes(fileId)) {
      setFilesToDelete((prev) => prev.filter((id) => id !== fileId));
    } else {
      setFilesToDelete((prev) => [...prev, fileId]);
    }
  };

  const resetForm = () => {
    setName(dataset.dataset_name);
    setDescription(dataset.dataset_description || "");
    setGeographicLocation(dataset.geographic_location || "");
    setDataTimePeriod(dataset.data_time_period || "");
    setSelectedTags(dataset.tags || []);
    setNewFiles([]);
    setFilesToDelete([]);
    setSelectedOwners([]);
    setOriginalOwners(dataset.owners || []);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Update dataset metadata
      const hasMetadataChanges =
        name !== dataset.dataset_name ||
        description !== dataset.dataset_description ||
        geographicLocation !== (dataset.geographic_location || "") ||
        dataTimePeriod !== (dataset.data_time_period || "") ||
        JSON.stringify(selectedTags) !== JSON.stringify(dataset.tags || []);

      if (hasMetadataChanges) {
        await updateDataset(datasetId, {
          dataset_name: name,
          dataset_description: description,
          geographic_location: geographicLocation || undefined,
          data_time_period: dataTimePeriod || undefined,
          uploader_id: dataset.uploader_id,
          downloads_count: dataset.downloads_count,
          tags: selectedTags,
        });
      }

      // 2. Delete files marked for deletion
      for (const fileId of filesToDelete) {
        await deleteDatasetFile(fileId);
      }

      // 3. Upload new files
      for (const fileItem of newFiles) {
        await uploadFileToDataset(parseInt(datasetId), fileItem.file);
      }

      // 4. Handle owner changes
      const currentOwnerIds = selectedOwners.map((owner) => owner.user_id);
      const ownersToAdd = currentOwnerIds.filter(
        (id) => !originalOwners.includes(id)
      );
      const ownersToRemove = originalOwners.filter(
        (id) => !currentOwnerIds.includes(id)
      );

      // Add new owners
      for (const userId of ownersToAdd) {
        try {
          await addDatasetOwner(datasetId, userId);
        } catch (error) {
          console.error(`Failed to add owner ${userId}:`, error);
          // Continue with other operations even if one fails
        }
      }

      // Remove owners
      for (const userId of ownersToRemove) {
        try {
          await removeDatasetOwner(datasetId, userId);
        } catch (error) {
          console.error(`Failed to remove owner ${userId}:`, error);
          // Continue with other operations even if one fails
        }
      }

      // 5. Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });
      queryClient.invalidateQueries({ queryKey: ["datasetFiles", datasetId] });

      toast({
        title: "Success",
        description: "Dataset updated successfully",
        variant: "success",
      });

      // Reset form state to fix the visual bug
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error updating dataset:", error);
      toast({
        title: "Error",
        description: "Failed to update dataset. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className="!bg-background !bg-opacity-100 max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          opacity: 1,
          backgroundColor: "var(--background)",
          backdropFilter: "none",
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Dataset</DialogTitle>
          <DialogDescription>
            Make changes to your dataset metadata, add new files, or remove
            existing files.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Dataset Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-800"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-md h-24 dark:bg-gray-800"
                />
              </div>

              <div>
                <label
                  htmlFor="geographic_location"
                  className="block text-sm font-medium mb-1"
                >
                  Geographic Location{" "}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="geographic_location"
                  value={geographicLocation}
                  onChange={(e) => setGeographicLocation(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-800"
                  placeholder="e.g., Kenya, Nairobi County; Farm coordinates: 1.2921, 36.8219"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Specify where the data was collected (country, region, farm,
                  coordinates, etc.)
                </p>
              </div>

              <div>
                <label
                  htmlFor="data_time_period"
                  className="block text-sm font-medium mb-1"
                >
                  Data Time Period{" "}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="data_time_period"
                  value={dataTimePeriod}
                  onChange={(e) => setDataTimePeriod(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-800"
                  placeholder="e.g., 2020-2023, Growing season 2022, January-March 2024"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Specify when the data was collected (different from upload
                  date)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags <span className="text-gray-500">(Optional)</span>
                </label>
                <TagSelector
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  placeholder="Select tags for your dataset..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Dataset Owners{" "}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <UserOwnerSelector
                  selectedOwners={selectedOwners}
                  onOwnersChange={setSelectedOwners}
                  placeholder="Add other users as dataset owners..."
                  disabled={isSubmitting || isLoadingOwners}
                />
                {isLoadingOwners && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading current owners...
                  </p>
                )}
              </div>

              {/* Existing Files */}
              <div>
                <h3 className="text-md font-medium mb-2">Files</h3>
                {files.length === 0 ? (
                  <p className="text-gray-500">No files in this dataset.</p>
                ) : (
                  <div className="border rounded-md divide-y overflow-hidden">
                    {files.map((file) => (
                      <div
                        key={file.file_id}
                        className={`p-3 flex items-center justify-between ${
                          filesToDelete.includes(file.file_id)
                            ? "bg-red-50 dark:bg-red-900/20"
                            : "bg-gray-50 dark:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">{file.file_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {file.size
                                ? `${Math.round(file.size / 1024)} KB`
                                : "Size unknown"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFileToDelete(file.file_id)}
                          className={`p-1 rounded-full ${
                            filesToDelete.includes(file.file_id)
                              ? "text-white bg-red-500 hover:bg-red-600"
                              : "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                          }`}
                          aria-label={
                            filesToDelete.includes(file.file_id)
                              ? "Cancel file deletion"
                              : "Mark file for deletion"
                          }
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Files - Using FileUpload component with green highlight */}
              <div>
                <h3 className="text-md font-medium mb-2">Add New Files</h3>
                <div className="file-upload-new-files">
                  <FileUpload
                    maxFiles={10}
                    maxSize={100 * 1024 * 1024} // 100MB limit
                    files={newFiles}
                    setFiles={setNewFiles}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
