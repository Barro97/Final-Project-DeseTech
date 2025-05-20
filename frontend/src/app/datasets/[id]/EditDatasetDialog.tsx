"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
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
} from "@/app/features/dataset/services/datasetService";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { FileUpload } from "@/app/features/upload/components/organisms/FileUpload";
import { FileItem } from "@/app/features/upload/types/file";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFiles, setNewFiles] = useState<FileItem[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);

  // Reset form when dialog opens (to fix the visual bug)
  useEffect(() => {
    if (isOpen) {
      setName(dataset.dataset_name);
      setDescription(dataset.dataset_description || "");
      setNewFiles([]);
      setFilesToDelete([]);
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
    setNewFiles([]);
    setFilesToDelete([]);
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
        description !== dataset.dataset_description;

      if (hasMetadataChanges) {
        await updateDataset(datasetId, {
          dataset_name: name,
          dataset_description: description,
          uploader_id: dataset.uploader_id,
          downloads_count: dataset.downloads_count,
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

      // 4. Invalidate queries to refresh the data
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
        className="!bg-background !bg-opacity-100 max-w-3xl"
        style={{
          opacity: 1,
          backgroundColor: "var(--background)",
          backdropFilter: "none",
        }}
      >
        <DialogTitle>Edit Dataset</DialogTitle>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
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

            {/* New Files - Using FileUpload component */}
            <div>
              <h3 className="text-md font-medium mb-2">Add New Files</h3>
              <FileUpload
                maxFiles={10}
                maxSize={100 * 1024 * 1024} // 100MB limit
                files={newFiles}
                setFiles={setNewFiles}
              />
            </div>
          </div>

          <DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
}
