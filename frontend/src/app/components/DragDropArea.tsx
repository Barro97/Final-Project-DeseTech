import { Upload } from "lucide-react";
import { formatBytes } from "@/app/lib/uploadHelpers";
import { DragDropAreaProps } from "@/app/types/file";
import { useDragDrop } from "../hooks/useDragDrop";

function DragDropArea({
  maxFiles,
  maxSize,
  accept,
  onUpload,
  files,
  setFiles,
}: DragDropAreaProps) {
  const {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleButtonClick,
    fileInputRef,
  } = useDragDrop(maxFiles, maxSize, accept, files, setFiles, onUpload);

  return (
    <>
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
    </>
  );
}
export default DragDropArea;
