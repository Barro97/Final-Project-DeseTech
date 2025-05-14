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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    // Here you would handle the form submission with both the form data and files
    console.log("Form data:", data);
    console.log("Files:", files);

    // After successful upload, close the modal and reset
    setOpen(false);
  };

  const handleFileUpload = async (uploadedFiles: File[]): Promise<void> => {
    // Convert File[] to FileItem[] for tracking in state
    const fileItems = uploadedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 15),
      progress: 0,
      status: "idle" as const,
    }));
    setFiles(fileItems);
    return Promise.resolve();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="!bg-background !bg-opacity-100 max-w-xl"
        style={{
          opacity: 1,
          backgroundColor: "var(--background)",
          backdropFilter: "none",
        }}
      >
        <DialogHeader>
          <DialogTitle>Upload a new dataset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Dataset Name
            </label>
            <input
              id="name"
              className="w-full p-2 border rounded-md"
              placeholder="Enter dataset name"
              {...register("name", { required: "Dataset name is required" })}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
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
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
              accept=".csv,.json,.txt,.xlsx"
              onUpload={handleFileUpload}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Upload Dataset
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
