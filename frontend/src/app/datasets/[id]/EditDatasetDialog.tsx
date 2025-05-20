"use client";

import { useState, useRef } from "react";
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
import { FileText, Plus, Upload, X } from "lucide-react";
import {
  updateDataset,
  deleteDatasetFile,
  uploadFileToDataset,
} from "@/app/features/dataset/services/datasetService";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

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
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
      for (const file of newFiles) {
        await uploadFileToDataset(parseInt(datasetId), file);
      }

      // 4. Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });
      queryClient.invalidateQueries({ queryKey: ["datasetFiles", datasetId] });

      toast({
        title: "Success",
        description: "Dataset updated successfully",
        variant: "success",
      });

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

            {/* New Files */}
            <div>
              <h3 className="text-md font-medium mb-2">Add New Files</h3>

              {/* File input button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />

              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md w-fit"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Files
                </button>

                {/* Display selected files */}
                {newFiles.length > 0 && (
                  <div className="mt-2 border rounded-md divide-y overflow-hidden">
                    {newFiles.map((file, index) => (
                      <div
                        key={index}
                        className="p-3 flex items-center justify-between bg-green-50 dark:bg-green-900/20"
                      >
                        <div className="flex items-center">
                          <Upload className="w-5 h-5 text-green-500 mr-3" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(file.size / 1024)} KB
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(index)}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                          aria-label="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
