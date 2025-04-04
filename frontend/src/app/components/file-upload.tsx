"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { formatBytes, validateFile } from "@/app/lib/uploadHelpers";

type FileStatus = "idle" | "uploading" | "success" | "error";

interface FileItem {
  file: File;
  id: string;
  progress: number;
  status: FileStatus;
  error?: string;
}

interface FileUploadProps {
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
  onUpload?: (files: File[]) => Promise<void>;
}

export function FileUpload({
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = "*",
  onUpload,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = (fileList: FileList) => {
    const newFiles: FileItem[] = [];

    Array.from(fileList).forEach((file) => {
      const validation = validateFile(file, maxSize, accept);

      if (validation.valid) {
        newFiles.push({
          file,
          id: crypto.randomUUID(),
          progress: 0,
          status: "idle",
        });
      } else {
        newFiles.push({
          file,
          id: crypto.randomUUID(),
          progress: 0,
          status: "error",
          error: validation.error,
        });
      }
    });

    // Respect maxFiles limit
    const combinedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(combinedFiles);

    // Auto-upload if handler provided
    if (onUpload) {
      const validFiles = combinedFiles
        .filter((f) => f.status !== "error")
        .map((f) => f.file);

      if (validFiles.length > 0) {
        simulateUpload(combinedFiles.filter((f) => f.status !== "error"));
        onUpload(validFiles).catch(() => {
          // Handle upload error
          setFiles((prev) =>
            prev.map((f) => ({
              ...f,
              status: "error",
              error: "Upload failed",
              progress: 0,
            }))
          );
        });
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((file) => file.id !== id));
  };

  // This function simulates file upload progress
  // In a real application, you would track actual upload progress
  const simulateUpload = (filesToUpload: FileItem[]) => {
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

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drag and drop your files here or{" "}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={handleButtonClick}
              >
                browse
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {accept !== "*"
                ? `Accepted file types: ${accept}`
                : "All file types accepted"}
              {maxSize && ` • Max size: ${formatBytes(maxSize)}`}
              {maxFiles && ` • Max files: ${maxFiles}`}
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            multiple={maxFiles > 1}
            accept={accept}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-md bg-background"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2 rounded-md bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(file.file.size)}
                  </p>
                  {file.status === "error" && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {file.status === "uploading" && (
                  <div className="w-24">
                    <Progress value={file.progress} className="h-2" />
                  </div>
                )}

                {file.status === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}

                {file.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            </div>
          ))}

          {files.some((f) => f.status === "idle") && (
            <Button
              onClick={() => {
                const filesToUpload = files.filter((f) => f.status === "idle");
                simulateUpload(filesToUpload);
                if (onUpload) {
                  onUpload(filesToUpload.map((f) => f.file));
                }
              }}
              className="mt-2"
            >
              Upload {files.filter((f) => f.status === "idle").length} files
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
