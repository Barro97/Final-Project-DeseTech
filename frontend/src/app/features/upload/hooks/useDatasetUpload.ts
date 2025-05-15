import { useState } from "react";
import { FileItem } from "../types/file";
import axios from "axios";
import { useToast } from "../../toaster/hooks/useToast";
import { useAuth } from "../../auth/context/AuthContext";

export interface DatasetFormData {
  name: string;
  description: string;
  uploader_id: number;
}

export interface UploadProgressInfo {
  progress: number;
  currentFile: string | null;
  totalFiles: number;
  completedFiles: number;
  status: "idle" | "uploading" | "completed" | "error";
  error?: string;
}

export function useDatasetUpload() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo>({
    progress: 0,
    currentFile: null,
    totalFiles: 0,
    completedFiles: 0,
    status: "idle",
  });

  const uploadDataset = async (
    formData: DatasetFormData,
    files: FileItem[]
  ): Promise<{ success: boolean; datasetId?: string; error?: string }> => {
    if (files.length === 0) {
      return {
        success: false,
        error: "Please select at least one file to upload",
      };
    }

    try {
      // Reset progress state
      setUploadProgress({
        progress: 0,
        currentFile: null,
        totalFiles: files.length,
        completedFiles: 0,
        status: "uploading",
      });
      // Step 1: Create dataset and get dataset ID
      const datasetResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND}/datasets/`,
        {
          name: formData.name,
          description: formData.description,
          uploader_id: user?.id,
        }
      );
      const datasetId = datasetResponse.data.id;

      // Step 2: Upload each file with the dataset ID
      let completedFiles = 0;

      for (const fileItem of files) {
        setUploadProgress((prev) => ({
          ...prev,
          currentFile: fileItem.file.name,
        }));

        const fileFormData = new FormData();
        fileFormData.append("file", fileItem.file);
        fileFormData.append("dataset_id", datasetId);

        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND}/upload-file/`,
          fileFormData,
          {
            onUploadProgress: (progressEvent) => {
              const filePercentCompleted = progressEvent.progress
                ? Math.round(progressEvent.progress * 100)
                : 0;

              // Calculate overall progress based on completed files plus current file progress
              const overallProgress =
                ((completedFiles + filePercentCompleted / 100) / files.length) *
                100;

              setUploadProgress((prev) => ({
                ...prev,
                progress: Math.round(overallProgress),
              }));
            },
          }
        );

        // Update completed files count after each successful upload
        completedFiles++;

        setUploadProgress((prev) => ({
          ...prev,
          completedFiles,
          progress: Math.round((completedFiles / files.length) * 100),
        }));
      }

      // All files uploaded successfully
      setUploadProgress({
        progress: 100,
        currentFile: null,
        totalFiles: files.length,
        completedFiles: files.length,
        status: "completed",
      });

      toast({
        title: "Success!",
        description: `Dataset "${formData.name}" with ${files.length} files was uploaded successfully`,
        variant: "success",
      });

      return { success: true, datasetId };
    } catch (error) {
      let errorMessage = "An error occurred during the upload";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }

      setUploadProgress((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }));

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "error",
      });

      return { success: false, error: errorMessage };
    }
  };

  const resetUploadProgress = () => {
    setUploadProgress({
      progress: 0,
      currentFile: null,
      totalFiles: 0,
      completedFiles: 0,
      status: "idle",
    });
  };

  return {
    uploadDataset,
    uploadProgress,
    resetUploadProgress,
  };
}
