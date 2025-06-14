import axios from "axios";
import {
  Dataset,
  DatasetFile,
  PublicStats,
  SearchFilters,
} from "../types/datasetTypes";

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND}`;

// Get all datasets with optional filters
export async function getAllDatasets(
  page: number = 1,
  limit: number = 12,
  search?: string,
  sortBy?: string,
  filters?: Record<string, string | number | boolean>
): Promise<{ datasets: Dataset[]; total: number; hasMore: boolean }> {
  // Build query params
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (search) params.append("search", search);
  if (sortBy) params.append("sort_by", sortBy);

  // Add any additional filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });
  }

  // Make the API request
  const response = await axios.get(`${API_URL}/datasets?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
  });

  return response.data;
}

// Get all datasets for a specific user
export async function getUserDatasets(
  userId: string | number
): Promise<Dataset[]> {
  const response = await axios.get(`${API_URL}/datasets/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
}

// Get a single dataset by ID
export async function getDatasetById(
  datasetId: string | number
): Promise<Dataset> {
  const response = await axios.get(`${API_URL}/datasets/${datasetId}`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
}

// Get files for a dataset
export async function getDatasetFiles(
  datasetId: string | number
): Promise<DatasetFile[]> {
  const response = await axios.get(`${API_URL}/datasets/${datasetId}/files`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
}

// Download a file
export async function downloadFile(fileId: string | number): Promise<Blob> {
  const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
    responseType: "blob",
  });
  return response.data;
}

// Download entire dataset as zip file
export async function downloadDataset(
  datasetId: string | number
): Promise<Blob> {
  const response = await axios.get(
    `${API_URL}/datasets/${datasetId}/download`,
    {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
      responseType: "blob",
    }
  );
  return response.data;
}

// Expected response structure from the batch delete endpoint
export interface BatchDeleteResponse {
  message: string;
  deleted_count: number;
  errors: Array<{ dataset_id: number; error: string }>;
}

// Delete multiple datasets
export async function deleteDatasets(
  datasetIds: number[]
): Promise<BatchDeleteResponse> {
  try {
    const response = await axios.post<BatchDeleteResponse>(
      `${API_URL}/datasets/batch-delete`,
      { dataset_ids: datasetIds },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting datasets:", error);
    throw error; // Re-throw to handle in the UI layer
  }
}

// Delete a single dataset
export async function deleteDataset(datasetId: string | number): Promise<void> {
  try {
    await axios.delete(`${API_URL}/datasets/${datasetId}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    throw error; // Re-throw to handle in the UI layer
  }
}

// Update dataset metadata
export async function updateDataset(
  datasetId: string | number,
  updateData: Partial<Dataset>
): Promise<Dataset> {
  try {
    const response = await axios.put<Dataset>(
      `${API_URL}/datasets/${datasetId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating dataset:", error);
    throw error;
  }
}

// Delete a file from a dataset
export async function deleteDatasetFile(fileId: number): Promise<void> {
  try {
    await axios.delete(`${API_URL}/delete_file/${fileId}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

// Upload a file to a dataset
export async function uploadFileToDataset(
  datasetId: number,
  file: File
): Promise<DatasetFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("dataset_id", datasetId.toString());

  try {
    const response = await axios.post(`${API_URL}/upload-file/`, formData, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export interface PreviewData {
  [key: string]: string | number | boolean | null;
}

export interface PreviewResponse {
  data: PreviewData[] | string[][]; // Can be JSON objects or CSV rows
  total_size: number;
  has_more: boolean;
  current_offset: number;
  file_type: string;
  headers?: string[];
}

// Get file preview
export async function getFilePreview(
  fileId: number,
  offset: number = 0,
  maxRows: number = 50
): Promise<PreviewResponse> {
  try {
    const response = await axios.get(`${API_URL}/files/${fileId}/preview`, {
      params: {
        offset,
        max_rows: maxRows,
      },
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting file preview:", error);
    throw error;
  }
}

/**
 * Get public statistics for homepage display
 * No authentication required
 */
export async function getPublicStats(): Promise<PublicStats> {
  try {
    const response = await axios.get(`${API_URL}/datasets/public-stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching public stats:", error);
    throw error;
  }
}

// Get available file types for filtering
export async function getAvailableFileTypes(): Promise<string[]> {
  try {
    const response = await axios.get(
      `${API_URL}/datasets/available-file-types`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching available file types:", error);
    throw error;
  }
}

// Get search suggestions based on dataset names and descriptions
export async function getSearchSuggestions(
  searchTerm: string,
  limit: number = 8
): Promise<string[]> {
  try {
    // Don't make API call for very short search terms
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const response = await axios.get(`${API_URL}/datasets/search-suggestions`, {
      params: {
        search_term: searchTerm.trim(),
        limit: limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    // Return empty array on error to gracefully degrade
    return [];
  }
}

// Search datasets using the backend search endpoint
export const searchDatasets = async (
  filters: SearchFilters
): Promise<{ datasets: Dataset[]; total: number; hasMore: boolean }> => {
  const params = new URLSearchParams();

  // Add basic parameters
  if (filters.search_term) params.append("search_term", filters.search_term);
  if (filters.sort_by) params.append("sort_by", filters.sort_by);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  // Add array parameters
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => params.append("tags", tag));
  }

  if (filters.file_types && filters.file_types.length > 0) {
    filters.file_types.forEach((fileType) =>
      params.append("file_types", fileType)
    );
  }

  if (filters.approval_status && filters.approval_status.length > 0) {
    filters.approval_status.forEach((status) =>
      params.append("approval_status", status)
    );
  }

  // Add other parameters
  if (filters.uploader_id)
    params.append("uploader_id", filters.uploader_id.toString());
  if (filters.date_from) params.append("date_from", filters.date_from);
  if (filters.date_to) params.append("date_to", filters.date_to);
  if (filters.has_location !== undefined)
    params.append("has_location", filters.has_location.toString());
  if (filters.min_downloads !== undefined)
    params.append("min_downloads", filters.min_downloads.toString());
  if (filters.max_downloads !== undefined)
    params.append("max_downloads", filters.max_downloads.toString());

  const url = `${API_URL}/datasets/search?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return {
    datasets: data.datasets || [],
    total: data.total_count || 0,
    hasMore: data.has_next || false,
  };
};
