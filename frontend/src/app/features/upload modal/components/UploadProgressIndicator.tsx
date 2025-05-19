"use client";

import { UploadProgressInfo } from "@/app/features/upload/hooks/useDatasetUpload";

interface UploadProgressIndicatorProps {
  uploadProgress: UploadProgressInfo;
}

export function UploadProgressIndicator({
  uploadProgress,
}: UploadProgressIndicatorProps) {
  if (
    uploadProgress.status !== "uploading" &&
    uploadProgress.status !== "completed"
  ) {
    return null; // Don't show if idle or error (errors handled by toast)
  }

  return (
    <div className="space-y-2 p-4 border rounded-md bg-gray-50">
      <div className="flex justify-between text-sm">
        <span>
          {uploadProgress.status === "completed"
            ? "Upload Complete!"
            : "Uploading dataset..."}
        </span>
        <span>{uploadProgress.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress.progress}%` }}
        ></div>
      </div>
      {uploadProgress.status === "uploading" && uploadProgress.currentFile && (
        <p className="text-xs text-gray-500">
          Uploading: {uploadProgress.currentFile} (
          {uploadProgress.completedFiles} of {uploadProgress.totalFiles})
        </p>
      )}
    </div>
  );
}
