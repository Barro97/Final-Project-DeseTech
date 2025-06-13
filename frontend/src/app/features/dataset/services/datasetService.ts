import axios from "axios";
import {
  Dataset,
  DatasetFile,
  PublicStats,
  SearchFilters,
  SearchResponse,
  SearchResult,
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
  const response = await fetch(`${API_URL}/datasets/public-stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch public stats: ${response.statusText}`);
  }

  return response.json();
}

// Search datasets using the backend search endpoint
export async function searchDatasets(
  filters: SearchFilters
): Promise<SearchResult> {
  try {
    // Build query params from filters
    const params = new URLSearchParams();

    if (filters.search_term) params.append("search_term", filters.search_term);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => params.append("tags", tag));
    }
    if (filters.uploader_id)
      params.append("uploader_id", filters.uploader_id.toString());
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);
    if (filters.sort_by) {
      // Only send valid sort values to the backend
      const validSortValues = ["newest", "oldest", "downloads", "name"];
      if (validSortValues.includes(filters.sort_by)) {
        params.append("sort_by", filters.sort_by);
      }
    }

    // Default pagination values
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    // Make the API request to the search endpoint
    const response = await axios.get<SearchResponse>(
      `${API_URL}/datasets/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
      }
    );

    // Transform backend response to frontend format
    const backendData = response.data;
    return {
      datasets: backendData.datasets,
      total: backendData.total_count,
      hasMore: backendData.has_next,
    };
  } catch (error) {
    console.error("Error searching datasets:", error);
    throw error;
  }
}
