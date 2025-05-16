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
          dataset_name: formData.name,
          dataset_description: formData.description,
          uploader_id: user?.id,
        }
      );

      // Log the entire response to see its structure
      console.log("Dataset creation response:", datasetResponse.data);

      // Check if we have a valid response with dataset_id
      if (!datasetResponse.data || !datasetResponse.data.dataset_id) {
        throw new Error(
          `Failed to get dataset ID from response: ${JSON.stringify(datasetResponse.data)}`
        );
      }

      const datasetId = datasetResponse.data.dataset_id;
      console.log("Dataset created with ID:", datasetId);

      // Validate dataset ID immediately after receiving it
      if (!datasetId || isNaN(Number(datasetId))) {
        throw new Error(`Invalid dataset ID received: ${datasetId}`);
      }

      // Step 2: Upload each file with the dataset ID
      let completedFiles = 0;

      for (const fileItem of files) {
        try {
          console.log(
            "Starting upload for file:",
            fileItem.file.name,
            "with dataset ID:",
            datasetId
          );
          setUploadProgress((prev) => ({
            ...prev,
            currentFile: fileItem.file.name,
          }));

          const fileFormData = new FormData();
          // Add file first to ensure it's properly added
          fileFormData.append("file", fileItem.file);

          // Validate and add dataset_id
          const numericDatasetId = Number(datasetId);
          if (isNaN(numericDatasetId)) {
            throw new Error(`Invalid dataset ID: ${datasetId}`);
          }
          fileFormData.append("dataset_id", numericDatasetId.toString());

          // Log FormData contents (for debugging)
          console.log("FormData contents:");
          for (const pair of fileFormData.entries()) {
            console.log(pair[0], pair[1]);
          }

          const uploadResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND}/upload-file/`,
            fileFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              onUploadProgress: (progressEvent) => {
                const filePercentCompleted = progressEvent.progress
                  ? Math.round(progressEvent.progress * 100)
                  : 0;

                const overallProgress =
                  ((completedFiles + filePercentCompleted / 100) /
                    files.length) *
                  100;

                setUploadProgress((prev) => ({
                  ...prev,
                  progress: Math.round(overallProgress),
                }));
              },
            }
          );

          console.log("File upload response:", uploadResponse.data);

          // Update completed files count after each successful upload
          completedFiles++;

          setUploadProgress((prev) => ({
            ...prev,
            completedFiles,
            progress: Math.round((completedFiles / files.length) * 100),
          }));
        } catch (error) {
          console.error("Error uploading file:", fileItem.file.name, error);
          if (axios.isAxiosError(error)) {
            console.error("Response data:", error.response?.data);
            console.error("Response status:", error.response?.status);
          }
          throw error; // Re-throw to be caught by the outer try-catch
        }
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
