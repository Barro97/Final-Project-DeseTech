import { useState, useEffect } from "react";
import {
  getFilePreview,
  PreviewResponse,
  PreviewData,
} from "../services/datasetService";
import { DatasetFile } from "../types/datasetTypes";
import { useToast } from "@/app/features/toaster/hooks/useToast";

interface UseFilePreviewProps {
  files: DatasetFile[];
}

interface UseFilePreviewReturn {
  currentFile: DatasetFile | null;
  previewData: PreviewResponse | null;
  isLoading: boolean;
  isLazyLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  selectFile: (fileId: number) => void;
}

export function useFilePreview({
  files,
}: UseFilePreviewProps): UseFilePreviewReturn {
  const [currentFile, setCurrentFile] = useState<DatasetFile | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle file list changes (including deletions)
  useEffect(() => {
    const previewableFiles = files.filter(
      (file) =>
        file.file_type === "text/csv" || file.file_type === "application/json"
    );

    // If no previewable files, clear everything
    if (previewableFiles.length === 0) {
      setCurrentFile(null);
      setPreviewData(null);
      setError(null);
      return;
    }

    // Check if current file still exists in the files list
    const currentFileStillExists =
      currentFile &&
      previewableFiles.some((f) => f.file_id === currentFile.file_id);

    if (!currentFileStillExists) {
      // Current file was deleted or doesn't exist, select the first available file
      const firstPreviewableFile = previewableFiles[0];
      setCurrentFile(firstPreviewableFile);
      setPreviewData(null); // Clear old preview data
      setError(null);
    }
  }, [files, currentFile]);

  // Load preview data when current file changes
  useEffect(() => {
    if (currentFile) {
      loadPreview();
    } else {
      // Clear preview data when no file is selected
      setPreviewData(null);
      setError(null);
    }
  }, [currentFile]);

  const loadPreview = async () => {
    if (!currentFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getFilePreview(currentFile.file_id);
      setPreviewData(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load preview";
      setError(message);
      setPreviewData(null); // Clear any existing preview data on error
      toast({
        title: "Error",
        description: message,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (
      !currentFile ||
      !previewData ||
      !previewData.has_more ||
      isLoading ||
      isLazyLoading
    )
      return;

    setIsLazyLoading(true);
    try {
      const nextChunk = await getFilePreview(
        currentFile.file_id,
        previewData.current_offset
      );

      setPreviewData((prev) => {
        if (!prev) return nextChunk;

        // Ensure we're combining the data correctly based on file type
        let combinedData: PreviewResponse["data"];
        if (currentFile.file_type === "text/csv") {
          // For CSV, data should be string[][]
          combinedData = [
            ...(prev.data as string[][]),
            ...(nextChunk.data as string[][]),
          ];
        } else {
          // For JSON, data should be PreviewData[]
          combinedData = [
            ...(prev.data as PreviewData[]),
            ...(nextChunk.data as PreviewData[]),
          ];
        }

        return {
          ...nextChunk,
          data: combinedData as PreviewResponse["data"],
          headers: prev.headers || nextChunk.headers,
        };
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load more data";
      toast({
        title: "Error",
        description: message,
        variant: "error",
      });
    } finally {
      setIsLazyLoading(false);
    }
  };

  const selectFile = (fileId: number) => {
    const file = files.find((f) => f.file_id === fileId);
    if (file) {
      if (
        file.file_type !== "text/csv" &&
        file.file_type !== "application/json"
      ) {
        toast({
          title: "Error",
          description: "This file type is not supported for preview",
          variant: "error",
        });
        return;
      }
      setCurrentFile(file);
      setPreviewData(null); // Reset preview data for new file
      setError(null); // Clear any existing errors
    }
  };

  return {
    currentFile,
    previewData,
    isLoading,
    isLazyLoading,
    error,
    loadMore,
    hasMore: Boolean(previewData?.has_more),
    selectFile,
  };
}
