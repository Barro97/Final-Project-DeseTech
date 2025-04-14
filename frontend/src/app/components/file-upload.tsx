"use client";

import DragDropArea from "./DragDropArea";
import { FileItem, FileUploadProps } from "@/app/types/file";
// import { useFileUpload } from "../hooks/useUpload";
import FileList from "./FileList";
import { useState } from "react";

export function FileUpload({
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = "*",
  onUpload,
}: FileUploadProps) {
  // const { files, setFiles } = useFileUpload();
  const [files, setFiles] = useState<FileItem[]>([]);

  return (
    <div className="w-full">
      <DragDropArea
        maxFiles={maxFiles}
        maxSize={maxSize}
        accept={accept}
        files={files}
        setFiles={setFiles}
        onUpload={onUpload}
      />
      {files.length > 0 && (
        <FileList files={files} onUpload={onUpload} setFiles={setFiles} />
      )}
    </div>
  );
}
