"use client";
import React, { useState, useMemo } from "react";
import { useUsers, useRoles } from "../hooks/useAdminData";
import {
  AdminUser,
  AdminFilterRequest,
  UserRoleUpdateRequest,
} from "../types/adminTypes";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Card } from "@/app/components/molecules/card";
import {
  Search,
  Filter,
  Users,
  Mail,
  Database,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Shield,
  Trash2,
} from "lucide-react";

interface RoleUpdateDialogProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (request: UserRoleUpdateRequest) => Promise<boolean>;
  availableRoles: Array<{ role_id: number; role_name: string }>;
}

function RoleUpdateDialog({
  user,
  isOpen,
  onClose,
  onUpdate,
  availableRoles,
}: RoleUpdateDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role_name || "");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsSubmitting(true);
    const success = await onUpdate({
      user_id: user.user_id,
      role_name: selectedRole,
    });

    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Update User Role
        </h3>

        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.username}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current role: {user.role_name || "No role assigned"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select a role</option>
              {availableRoles.map((role) => (
                <option key={role.role_id} value={role.role_name}>
                  {role.role_name.charAt(0).toUpperCase() +
                    role.role_name.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || !selectedRole || selectedRole === user.role_name
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                "Update Role"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface UserCardProps {
  user: AdminUser;
  onEditRole: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
}

interface DeleteUserDialogProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (userId: number) => Promise<boolean>;
}

function DeleteUserDialog({
  user,
  isOpen,
  onClose,
  onDelete,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await onDelete(user.user_id);
    if (success) {
      onClose();
    }
    setIsDeleting(false);
  };

  const displayName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete User Account
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to permanently delete{" "}
            <strong>{displayName}</strong>?
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
              This will permanently delete:
            </h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• User account and profile information</li>
              <li>
                • All datasets uploaded by this user ({user.dataset_count || 0}{" "}
                datasets)
              </li>
              <li>• All files associated with their datasets</li>
              <li>• All comments and activity by this user</li>
              <li>
                • User's ownership of other datasets (removed from owned
                datasets)
              </li>
            </ul>
          </div>

          {user.dataset_count > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Warning:</strong> This user has uploaded{" "}
                {user.dataset_count} dataset(s). Deleting this user will also
                delete all their datasets and files.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete User Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onEditRole, onDeleteUser }: UserCardProps) {
  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "moderator":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.username}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{user.username}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role_name)}`}
          >
            {user.role_name ? (
              <>
                <Shield className="h-3 w-3 inline mr-1" />
                {user.role_name.charAt(0).toUpperCase() +
                  user.role_name.slice(1)}
              </>
            ) : (
              "No role"
            )}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
          >
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Mail className="h-4 w-4" />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Database className="h-4 w-4" />
          <span>{user.dataset_count} datasets</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onEditRole(user)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <UserCog className="h-4 w-4" />
          Edit Role
        </button>
        <button
          onClick={() => onDeleteUser(user)}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete User
        </button>
      </div>
    </Card>
  );
}

export function UserManagement() {
  const initialFilters: AdminFilterRequest = {
    page: 1,
    limit: 12,
  };

  const {
    users,
    loading,
    error,
    updateFilters,
    changePage,
    handleRoleUpdate,
    handleUserDelete,
  } = useUsers(initialFilters);
  const { roles } = useRoles();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] =
    useState<AdminUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Apply filters when inputs change
  const handleSearch = () => {
    updateFilters({
      search_term: searchTerm || undefined,
      role_filter: roleFilter || undefined,
    });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    updateFilters({
      search_term: undefined,
      role_filter: undefined,
    });
  };

  const handleEditRole = (user: AdminUser) => {
    setSelectedUser(user);
    setShowRoleDialog(true);
  };

  const handleCloseRoleDialog = () => {
    setShowRoleDialog(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUserForDelete(user);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setSelectedUserForDelete(null);
  };

  const totalPages = useMemo(() => {
    if (!users) return 0;
    return Math.ceil(users.total_count / users.limit);
  }, [users]);

  const hasActiveFilters = searchTerm || roleFilter;

  if (loading && !users) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Search and manage user accounts and roles
          {users && ` (${users.total_count} total users)`}
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, username..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_name}>
                  {role.role_name.charAt(0).toUpperCase() +
                    role.role_name.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Users Grid */}
      {users && users.items.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No users found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {hasActiveFilters
              ? "Try adjusting your search filters."
              : "No users match your criteria."}
          </p>
        </div>
      ) : (
        <>
          {loading && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="md" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users?.items.map((user) => (
              <UserCard
                key={user.user_id}
                user={user}
                onEditRole={handleEditRole}
                onDeleteUser={handleDeleteUser}
              />
            ))}
          </div>

          {/* Pagination */}
          {users && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(users.page - 1) * users.limit + 1} to{" "}
                {Math.min(users.page * users.limit, users.total_count)} of{" "}
                {users.total_count} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(users.page - 1)}
                  disabled={!users.has_prev}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Page {users.page} of {totalPages}
                </span>
                <button
                  onClick={() => changePage(users.page + 1)}
                  disabled={!users.has_next}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Role Update Dialog */}
      <RoleUpdateDialog
        user={selectedUser}
        isOpen={showRoleDialog}
        onClose={handleCloseRoleDialog}
        onUpdate={handleRoleUpdate}
        availableRoles={roles}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={selectedUserForDelete}
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onDelete={handleUserDelete}
      />
    </div>
  );
}
