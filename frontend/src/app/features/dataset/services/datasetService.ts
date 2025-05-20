import axios from "axios";
import { Dataset, DatasetFile } from "../types/datasetTypes";

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND}`;

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
