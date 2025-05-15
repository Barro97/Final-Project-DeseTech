"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/dialog";
import { useForm } from "react-hook-form";
import { FileUpload } from "@/app/features/upload/components/file-upload";
import { FileItem } from "@/app/features/upload/types/file";
import { useState } from "react";
import { useDatasetUpload } from "@/app/features/upload/hooks/useDatasetUpload";
import { useToast } from "@/app/features/toaster/hooks/useToast";

type FormData = {
  name: string;
  description: string;
};

export function UploadModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const { uploadDataset, uploadProgress, resetUploadProgress } =
    useDatasetUpload();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file to upload",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await uploadDataset(data, files);

      if (result.success) {
        // Reset the form and state after successful upload
        reset();
        setFiles([]);
        resetUploadProgress();
        // Close the modal after a slight delay to show the complete progress
        setTimeout(() => {
          setOpen(false);
          setIsSubmitting(false);
        }, 1000);
      } else {
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error uploading dataset:", err);
      setIsSubmitting(false);
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred during upload",
        variant: "error",
      });
    }
  };

  // Reset files when modal closes
  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Only reset if we're closing the modal and not in the middle of uploading
      if (!isSubmitting) {
        setFiles([]);
        resetUploadProgress();
        reset();
      }
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent
        className="!bg-background !bg-opacity-100 max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          opacity: 1,
          backgroundColor: "var(--background)",
          backdropFilter: "none",
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Upload a new dataset</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-1">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Dataset Name
              </label>
              <input
                id="name"
                className="w-full p-2 border rounded-md"
                placeholder="Enter dataset name"
                disabled={isSubmitting}
                {...register("name", { required: "Dataset name is required" })}
              />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                className="w-full p-2 border rounded-md min-h-[80px]"
                placeholder="Provide a short description of the dataset"
                disabled={isSubmitting}
                {...register("description", {
                  required: "Description is required",
                })}
              />
              {errors.description && (
                <p className="text-destructive text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Files</label>
              <FileUpload
                maxFiles={10}
                maxSize={500 * 1024 * 1024} // 500MB
                files={files}
                setFiles={setFiles}
              />
              {files.length === 0 && isSubmitting && (
                <p className="text-destructive text-sm">
                  Please select at least one file
                </p>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress.status === "uploading" && (
              <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between text-sm">
                  <span>Uploading dataset...</span>
                  <span>{uploadProgress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
                {uploadProgress.currentFile && (
                  <p className="text-xs text-gray-500">
                    Uploading: {uploadProgress.currentFile} (
                    {uploadProgress.completedFiles} of{" "}
                    {uploadProgress.totalFiles})
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-6 mt-8 border-t">
              <button
                type="button"
                onClick={() => handleModalClose(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: "var(--primary)" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Uploading..." : "Upload Dataset"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
