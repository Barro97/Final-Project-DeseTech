"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadCoverPhoto } from "../../dataset/services/datasetService";

interface CoverPhotoUploadState {
  isUploading: boolean;
  error: string | null;
}

export function useCoverPhotoUpload() {
  const [state, setState] = useState<CoverPhotoUploadState>({
    isUploading: false,
    error: null,
  });
  const queryClient = useQueryClient();

  const uploadPhoto = async (datasetId: string, coverPhoto: File) => {
    setState({ isUploading: true, error: null });

    try {
      const result = await uploadCoverPhoto(datasetId, coverPhoto);
      setState({ isUploading: false, error: null });

      // Invalidate all dataset-related queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["userDatasets"] });
      await queryClient.invalidateQueries({ queryKey: ["allDatasets"] });
      await queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });

      return { success: true, dataset: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload cover photo";
      setState({ isUploading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  return {
    uploadPhoto,
    isUploading: state.isUploading,
    error: state.error,
  };
}
