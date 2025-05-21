import { useFilePreview } from "../../hooks/useFilePreview";
import { DatasetFile } from "../../types/datasetTypes";
import { CSVPreview } from "./CSVPreview";
import { JSONPreview } from "./JSONPreview";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

interface FilePreviewProps {
  files: DatasetFile[];
}

export function FilePreview({ files }: FilePreviewProps) {
  const [initialLoading, setInitialLoading] = useState(true);
  const {
    currentFile,
    previewData,
    isLoading,
    error,
    loadMore,
    hasMore,
    selectFile,
  } = useFilePreview({ files });

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

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

  // Load more data when the load more trigger comes into view
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

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
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {file.file_name}
            </button>
          ))}
        </div>
      )}

      {/* Preview content */}
      <div className="border rounded-lg overflow-hidden bg-white">
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
              <CSVPreview
                data={previewData.data as string[][]}
                headers={previewData.headers}
              />
            ) : (
              <JSONPreview data={previewData.data} />
            )}

            {/* Load more trigger */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="p-4 flex justify-center border-t"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <span className="text-gray-500">Loading more...</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
