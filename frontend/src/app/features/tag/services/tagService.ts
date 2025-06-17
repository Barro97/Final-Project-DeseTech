import axios from "axios";
import {
  Tag,
  TagCreate,
  TagUpdate,
  TagList,
  TagDeleteResponse,
} from "../types/tagTypes";

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND}`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Get all tags in the system (public endpoint)
 * No authentication required as users need to see tags for dataset upload
 */
export async function getAllTags(): Promise<TagList> {
  try {
    const response = await axios.get(`${API_URL}/tags`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
}

/**
 * Get only tags that are associated with at least one dataset (public endpoint)
 * This is useful for filtering interfaces where unused tags would result in empty results
 */
export async function getUsedTags(): Promise<TagList> {
  try {
    const response = await axios.get(`${API_URL}/tags/used`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching used tags:", error);
    throw error;
  }
}

/**
 * Create a new tag (admin only)
 */
export async function createTag(tagData: TagCreate): Promise<Tag> {
  try {
    const response = await axios.post(`${API_URL}/tags`, tagData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
}

/**
 * Update an existing tag (admin only)
 */
export async function updateTag(
  tagId: number,
  tagData: TagUpdate
): Promise<Tag> {
  try {
    const response = await axios.put(`${API_URL}/tags/${tagId}`, tagData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error updating tag:", error);
    throw error;
  }
}

/**
 * Delete a tag (admin only)
 */
export async function deleteTag(tagId: number): Promise<TagDeleteResponse> {
  try {
    const response = await axios.delete(`${API_URL}/tags/${tagId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting tag:", error);
    throw error;
  }
}

/**
 * Get a single tag by ID
 */
export async function getTagById(tagId: number): Promise<Tag> {
  try {
    const response = await axios.get(`${API_URL}/tags/${tagId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tag:", error);
    throw error;
  }
}
