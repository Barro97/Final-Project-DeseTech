import { useState, useEffect } from "react";
import { getFilePreview, PreviewResponse } from "../services/datasetService";
import { DatasetFile } from "../types/datasetTypes";
import { useToast } from "@/app/features/toaster/hooks/useToast";

interface UseFilePreviewProps {
  files: DatasetFile[];
}

interface UseFilePreviewReturn {
  currentFile: DatasetFile | null;
  previewData: PreviewResponse | null;
  isLoading: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Find the first previewable file
  useEffect(() => {
    const previewableFile = files.find(
      (file) =>
        file.file_type === "text/csv" || file.file_type === "application/json"
    );
    if (previewableFile) {
      setCurrentFile(previewableFile);
    }
  }, [files]);

  // Load preview data when current file changes
  useEffect(() => {
    if (currentFile) {
      loadPreview();
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
    if (!currentFile || !previewData || !previewData.has_more || isLoading)
      return;

    setIsLoading(true);
    try {
      const nextChunk = await getFilePreview(
        currentFile.file_id,
        previewData.current_offset
      );

      setPreviewData((prev) => {
        if (!prev) return nextChunk;
        return {
          ...nextChunk,
          data: [...prev.data, ...nextChunk.data] as PreviewResponse["data"],
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
      setIsLoading(false);
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
    }
  };

  return {
    currentFile,
    previewData,
    isLoading,
    error,
    loadMore,
    hasMore: Boolean(previewData?.has_more),
    selectFile,
  };
}
