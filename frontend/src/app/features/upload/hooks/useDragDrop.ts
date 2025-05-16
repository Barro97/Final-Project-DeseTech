import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useProcessFile } from "./useProcessFile";
import { FileItem } from "../types/file";

export function useDragDrop(
  maxFiles: number,
  maxSize: number,
  accept: string | undefined,
  files: FileItem[],
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>,
  // Keep the parameter in the signature but mark as unused for compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpload: (files: File[]) => Promise<void>
) {
  const { processFiles } = useProcessFile(
    maxFiles,
    maxSize,
    accept,
    files,
    setFiles
  );

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

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleButtonClick,
    fileInputRef,
  };
}
