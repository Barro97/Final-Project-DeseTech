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
  const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    },
    responseType: "blob",
  });
  return response.data;
}
