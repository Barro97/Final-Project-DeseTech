import { useState } from "react";
import { FileItem } from "../types/file";

export function useFileUpload() {
  const [files, setFiles] = useState<FileItem[]>([]);

  // This function simulates file upload progress
  // In a real application, you would track actual upload progress
  const upload = (filesToUpload: FileItem[]) => {
    const fileIds = filesToUpload.map((f) => f.id);

    // Set all selected files to uploading state
    setFiles((prev) =>
      prev.map((f) =>
        fileIds.includes(f.id) ? { ...f, status: "uploading" as const } : f
      )
    );

    // Simulate progress updates
    const interval = setInterval(() => {
      setFiles((prev) => {
        const allDone = prev.every(
          (f) => !fileIds.includes(f.id) || f.progress >= 100
        );

        if (allDone) {
          clearInterval(interval);

          // Set all uploaded files to success state
          return prev.map((f) =>
            fileIds.includes(f.id) ? { ...f, status: "success" as const } : f
          );
        }

        return prev.map((f) => {
          if (fileIds.includes(f.id) && f.progress < 100) {
            const increment = Math.floor(Math.random() * 10) + 5;
            const newProgress = Math.min(f.progress + increment, 100);
            return { ...f, progress: newProgress };
          }
          return f;
        });
      });
    }, 300);
  };

  return { files, setFiles, upload };
}
