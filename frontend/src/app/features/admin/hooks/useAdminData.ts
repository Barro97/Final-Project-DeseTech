import { useState, useEffect, useCallback } from "react";
import {
  AdminStats,
  AdminDataset,
  AdminUser,
  AdminListResponse,
  AdminFilterRequest,
  Role,
  DatasetApprovalRequest,
  UserRoleUpdateRequest,
} from "../types/adminTypes";
import {
  getAdminStats,
  getPendingDatasets,
  getUsers,
  getRoles,
  approveDataset,
  updateUserRole,
  deleteUser,
} from "../services/adminService";

// Hook for admin statistics
export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for pending datasets
export const usePendingDatasets = (limit: number = 50) => {
  const [datasets, setDatasets] = useState<AdminDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingDatasets(limit);
      setDatasets(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch pending datasets"
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const handleApproval = useCallback(
    async (datasetId: number, approvalRequest: DatasetApprovalRequest) => {
      try {
        await approveDataset(datasetId, approvalRequest);
        // Remove the dataset from the pending list
        setDatasets((prev) => prev.filter((d) => d.dataset_id !== datasetId));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to process dataset"
        );
        return false;
      }
    },
    []
  );

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  return {
    datasets,
    loading,
    error,
    refetch: fetchDatasets,
    handleApproval,
  };
};

// Hook for user management
export const useUsers = (initialFilters: AdminFilterRequest) => {
  const [users, setUsers] = useState<AdminListResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilterRequest>(initialFilters);

  const fetchUsers = useCallback(
    async (newFilters?: AdminFilterRequest) => {
      try {
        setLoading(true);
        setError(null);
        const filtersToUse = newFilters || filters;
        const data = await getUsers(filtersToUse);
        setUsers(data);
        if (newFilters) {
          setFilters(newFilters);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<AdminFilterRequest>) => {
      const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset to page 1 when filters change
      fetchUsers(updatedFilters);
    },
    [filters, fetchUsers]
  );

  const changePage = useCallback(
    (page: number) => {
      const updatedFilters = { ...filters, page };
      fetchUsers(updatedFilters);
    },
    [filters, fetchUsers]
  );

  const handleRoleUpdate = useCallback(
    async (roleRequest: UserRoleUpdateRequest) => {
      try {
        await updateUserRole(roleRequest);
        // Refresh users after role update
        await fetchUsers();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update user role"
        );
        return false;
      }
    },
    [fetchUsers]
  );

  const handleUserDelete = useCallback(
    async (userId: number) => {
      try {
        await deleteUser(userId);
        // Refresh users after deletion
        await fetchUsers();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete user");
        return false;
      }
    },
    [fetchUsers]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    refetch: fetchUsers,
    handleRoleUpdate,
    handleUserDelete,
  };
};

// Hook for roles
export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, error, refetch: fetchRoles };
};
