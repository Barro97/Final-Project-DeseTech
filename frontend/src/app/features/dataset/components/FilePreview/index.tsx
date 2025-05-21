import { useFilePreview } from "../../hooks/useFilePreview";
import { DatasetFile } from "../../types/datasetTypes";
// @ts-expect-error - Components exist but TypeScript can't find them
import { CSVPreview } from "./CSVPreview";
// @ts-expect-error - Components exist but TypeScript can't find them
import { JSONPreview } from "./JSONPreview";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { useEffect, useState, useRef } from "react";

interface FilePreviewProps {
  files: DatasetFile[];
  onFileChange?: (fileName: string | null) => void;
}

export function FilePreview({ files, onFileChange }: FilePreviewProps) {
  const [initialLoading, setInitialLoading] = useState(true);
  const csvContainerRef = useRef<HTMLDivElement>(null);
  const jsonContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentFile,
    previewData,
    isLazyLoading,
    error,
    loadMore,
    hasMore,
    selectFile,
  } = useFilePreview({ files });

  // Set initial loading to false once data is loaded
  useEffect(() => {
    if (previewData || error) {
      setInitialLoading(false);
    }
  }, [previewData, error]);

  // Reset initial loading when file changes
  useEffect(() => {
    if (currentFile) {
      setInitialLoading(true);
    }
  }, [currentFile]);

  // Setup scroll event handlers to detect when to load more
  useEffect(() => {
    // Early return if we don't have data yet or don't need to load more
    if (!previewData || !hasMore || isLazyLoading) return;

    // Determine which container to observe based on file type
    const containerElement =
      currentFile?.file_type === "text/csv"
        ? csvContainerRef.current?.querySelector(".overflow-y-auto") // CSV scrollable container
        : jsonContainerRef.current?.querySelector(".overflow-y-auto"); // JSON scrollable container

    if (!containerElement) return;

    const handleScroll = () => {
      // If we're already loading or don't need more, skip
      if (!hasMore || isLazyLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = containerElement;
      // If we're close to the bottom (within 100px), load more
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMore();
      }
    };

    // Add scroll event listener
    containerElement.addEventListener("scroll", handleScroll);

    // Clean up the event listener
    return () => {
      containerElement.removeEventListener("scroll", handleScroll);
    };
  }, [previewData, hasMore, isLazyLoading, loadMore, currentFile]);

  // Add effect to notify parent component when currentFile changes
  useEffect(() => {
    if (onFileChange) {
      onFileChange(currentFile?.file_name || null);
    }
  }, [currentFile, onFileChange]);

  // Find previewable files
  const previewableFiles = files.filter(
    (file) =>
      file.file_type === "text/csv" || file.file_type === "application/json"
  );

  if (previewableFiles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No previewable files in this dataset.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File selector */}
      {previewableFiles.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {previewableFiles.map((file) => (
            <button
              key={file.file_id}
              onClick={() => selectFile(file.file_id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                currentFile?.file_id === file.file_id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {file.file_name}
            </button>
          ))}
        </div>
      )}

      {/* Preview content */}
      <div className="border rounded-lg overflow-hidden bg-white relative">
        {error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : initialLoading || !currentFile || !previewData ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Loading preview...</p>
          </div>
        ) : (
          <>
            {currentFile.file_type === "text/csv" ? (
              <div ref={csvContainerRef}>
                <CSVPreview
                  data={previewData.data as string[][]}
                  headers={previewData.headers}
                />
              </div>
            ) : (
              <div ref={jsonContainerRef}>
                <JSONPreview data={previewData.data} />
              </div>
            )}
          </>
        )}

        {/* Floating lazy loading indicator */}
        {isLazyLoading && (
          <div className="fixed inset-x-0 bottom-4 flex justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-xs mx-auto">
              <LoadingSpinner />
              <span className="text-gray-800 font-medium whitespace-nowrap">
                Loading more data...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
