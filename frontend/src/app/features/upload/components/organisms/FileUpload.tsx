"use client";

import DragDropArea from "./DragDropArea";
import { FileItem } from "@/app/features/upload/types/file";
// import { useFileUpload } from "../../hooks/useUpload"; // Adjusted path if it were used
import FileList from "./FileList";

export interface FileCollectionProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}

export function FileUpload({
  maxFiles = 10,
  maxSize = 500 * 1024 * 1024, // 500MB default
  accept,
  files,
  setFiles,
}: FileCollectionProps) {
  // const { files, setFiles } = useFileUpload();

  return (
    <div className="w-full">
      <DragDropArea
        maxFiles={maxFiles}
        maxSize={maxSize}
        accept={accept || "*"}
        files={files}
        setFiles={setFiles}
        onUpload={async () => {}} // Placeholder to satisfy interface
      />
      {files.length > 0 && (
        <FileList files={files} setFiles={setFiles} showUploadButton={false} />
      )}
    </div>
  );
}
