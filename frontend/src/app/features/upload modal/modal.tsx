"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/atoms/dialog";
import {
  useDatasetUpload,
  DatasetFormData,
} from "@/app/features/upload/hooks/useDatasetUpload";
import { FileItem } from "@/app/features/upload/types/file";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "../toaster/hooks/useToast";
import { useAuth } from "@/app/features/auth/context/AuthContext";

// Import the new components
import { DatasetMetadataForm } from "./components/DatasetMetadataForm";
import { DatasetFileUploadArea } from "./components/DatasetFileUploadArea";
import { UploadProgressIndicator } from "./components/UploadProgressIndicator";
import { TagSelector } from "@/app/features/tag/components/TagSelector";

// Form values managed by react-hook-form
interface UploadFormValues {
  name: string;
  description: string;
  geographic_location?: string;
  data_time_period?: string;
  tags?: string[];
}

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
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<UploadFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const onSubmit = async (data: UploadFormValues) => {
    if (!user || typeof user.id === "undefined") {
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please log in again.",
        variant: "error",
      });
      setIsSubmitting(false);
      return;
    }

    if (files.length === 0) {
      toast({
        title: "File Error",
        description: "Please select at least one file to upload.",
        variant: "error",
      });
      // Keep isSubmitting true if we consider this a submission attempt
      // but reset if the intention is to allow user to correct and resubmit immediately.
      // For now, let's allow correction, so don't set isSubmitting back to false here,
      // as the button state already reflects isSubmitting.
      return;
    }

    setIsSubmitting(true);
    try {
      const datasetPayload: DatasetFormData = {
        ...data,
        uploader_id: parseInt(user.id, 10),
        tags: selectedTags,
      };
      const result = await uploadDataset(datasetPayload, files);

      if (result.success) {
        toast({
          title: "Success!",
          description: `Dataset "${data.name}" uploaded successfully! Redirecting to dataset page...`,
          variant: "success",
        });

        // Reset form and files
        resetForm();
        setFiles([]);
        setSelectedTags([]);

        // Small delay to show success message, then redirect and close modal
        setTimeout(() => {
          setOpen(false);
          setIsSubmitting(false);
          resetUploadProgress();
          router.push(`/datasets/${result.datasetId}`);
        }, 1000);

        // Invalidate the user datasets cache so my-datasets page updates
        queryClient.invalidateQueries({
          queryKey: ["userDatasets", user?.id],
        });
      } else {
        // Error toast is handled by the useDatasetUpload hook
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error submitting dataset form:", err);
      setIsSubmitting(false);
      // General error toast if not caught by the hook
      if (!uploadProgress.error) {
        // Avoid double toast if hook already showed one
        toast({
          title: "Upload Failed",
          description: "An unexpected error occurred during form submission.",
          variant: "error",
        });
      }
    }
  };

  const handleModalClose = (newOpenState: boolean) => {
    if (!newOpenState) {
      if (
        !isSubmitting ||
        uploadProgress.status === "completed" ||
        uploadProgress.status === "error"
      ) {
        setFiles([]);
        resetUploadProgress();
        resetForm();
        setIsSubmitting(false); // Ensure submitting state is reset if modal is closed manually
      }
    }
    setOpen(newOpenState);
  };

  // Effect to reset form and files if modal is closed externally while not submitting
  useEffect(() => {
    if (!open && !isSubmitting) {
      setFiles([]);
      resetUploadProgress();
      resetForm();
      setSelectedTags([]);
    }
  }, [open, isSubmitting, resetForm, resetUploadProgress]);

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
          <DialogDescription>
            Fill in the details below to upload your dataset. Provide a name, a
            brief description, and select the files for upload.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <DatasetMetadataForm
              register={register}
              errors={errors}
              isSubmitting={isSubmitting}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tags <span className="text-gray-500">(Optional)</span>
              </label>
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                placeholder="Select tags for your dataset..."
                disabled={isSubmitting}
              />
            </div>

            <DatasetFileUploadArea
              files={files}
              setFiles={setFiles}
              isSubmitting={isSubmitting} // Pass isSubmitting to show conditional messages if needed
            />

            {(uploadProgress.status === "uploading" ||
              uploadProgress.status === "completed") && (
              <UploadProgressIndicator uploadProgress={uploadProgress} />
            )}

            <div className="flex justify-end gap-2 pt-6 mt-auto border-t">
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
                {isSubmitting
                  ? uploadProgress.status === "completed"
                    ? "Done"
                    : "Uploading..."
                  : "Upload Dataset"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
