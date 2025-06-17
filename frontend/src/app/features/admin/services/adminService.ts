import {
  AdminUser,
  AdminDataset,
  AdminStats,
  DatasetApprovalRequest,
  DatasetApprovalResponse,
  UserRoleUpdateRequest,
  UserManagementResponse,
  AdminListResponse,
  Role,
  AdminFilterRequest,
} from "../types/adminTypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Admin Statistics
export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch admin stats: ${response.statusText}`);
  }

  return response.json();
}

// Dataset Management
export async function getPendingDatasets(
  limit: number = 50
): Promise<AdminDataset[]> {
  const response = await fetch(
    `${API_BASE_URL}/admin/datasets/pending?limit=${limit}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch pending datasets: ${response.statusText}`);
  }

  return response.json();
}

export async function approveDataset(
  datasetId: number,
  approvalRequest: DatasetApprovalRequest
): Promise<DatasetApprovalResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/datasets/${datasetId}/approve`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(approvalRequest),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to ${approvalRequest.action} dataset: ${response.statusText}`
    );
  }

  return response.json();
}

// User Management
export async function getUsers(
  filters: AdminFilterRequest
): Promise<AdminListResponse<AdminUser>> {
  const params = new URLSearchParams();

  if (filters.search_term) params.append("search_term", filters.search_term);
  if (filters.role_filter) params.append("role_filter", filters.role_filter);
  params.append("page", filters.page.toString());
  params.append("limit", filters.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/admin/users?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
}

export async function updateUserRole(
  roleRequest: UserRoleUpdateRequest
): Promise<UserManagementResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/users/role`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(roleRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user role: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteUser(
  userId: number
): Promise<UserManagementResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete user: ${response.statusText}`);
  }

  return response.json();
}

export async function getRoles(): Promise<Role[]> {
  const response = await fetch(`${API_BASE_URL}/admin/roles`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch roles: ${response.statusText}`);
  }

  return response.json();
}

// Health check
export async function checkAdminHealth(): Promise<{
  status: string;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/health`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Admin health check failed: ${response.statusText}`);
  }

  return response.json();
}
