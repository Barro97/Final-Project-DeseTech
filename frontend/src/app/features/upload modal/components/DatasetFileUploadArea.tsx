"use client";

import { FileUpload } from "@/app/features/upload/components/organisms/FileUpload";
import { FileItem } from "@/app/features/upload/types/file";

interface DatasetFileUploadAreaProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  isSubmitting: boolean; // To show the 'Please select at least one file' message conditionally
}

export function DatasetFileUploadArea({
  files,
  setFiles,
  isSubmitting,
}: DatasetFileUploadAreaProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Upload Files</label>
      <FileUpload
        maxFiles={10}
        maxSize={500 * 1024 * 1024} // 500MB
        files={files}
        setFiles={setFiles}
        // If FileUpload component can be disabled, pass isSubmitting to it
        // disabled={isSubmitting}
      />
      {/* 
        The original modal shows this error: "files.length === 0 && isSubmitting && (...)"
        This means the error should only appear if a submission attempt was made without files.
        We pass `isSubmitting` here to replicate that. However, the primary validation for empty files
        is typically handled in the onSubmit handler before calling the API.
        The `FileUpload` component itself might have its own way of indicating errors or selection requirements.
      */}
      {files.length === 0 && isSubmitting && (
        <p className="text-destructive text-sm">
          Please select at least one file
        </p>
      )}
    </div>
  );
}
