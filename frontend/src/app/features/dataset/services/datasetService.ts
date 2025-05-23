import axios from "axios";
import { Dataset, DatasetFile } from "../types/datasetTypes";

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
  const response = await axios.get(`${API_URL}/${fileId}/download`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
    responseType: "blob",
  });
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
    const response = await axios.delete<BatchDeleteResponse>(
      `${API_URL}/datasets/batch-delete`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        data: { dataset_ids: datasetIds },
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
    const response = await axios.get(`${API_URL}/${fileId}/preview`, {
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
