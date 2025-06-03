export interface AdminUser {
  user_id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role_name?: string;
  status: string;
  last_login?: string;
  created_by?: number;
  dataset_count: number;
}

export interface AdminDataset {
  dataset_id: number;
  dataset_name: string;
  dataset_description?: string;
  uploader_id: number;
  uploader_name?: string;
  date_of_creation: string;
  approval_status: string;
  approved_by?: number;
  approval_date?: string;
  downloads_count: number;
  file_count: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_datasets: number;
  pending_datasets: number;
  approved_datasets: number;
  rejected_datasets: number;
  total_downloads: number;
  datasets_this_month: number;
  users_this_month: number;
  recent_activity: Array<{
    id: number;
    action: string;
    timestamp: string;
    details: string;
  }>;
  popular_categories: Array<{
    category: string;
    count: number;
  }>;
}

export interface DatasetApprovalRequest {
  action: "approve" | "reject";
  reason?: string;
}

export interface DatasetApprovalResponse {
  dataset_id: number;
  action: string;
  approved_by: number;
  approval_date: string;
  message: string;
}

export interface UserRoleUpdateRequest {
  user_id: number;
  role_name: string;
}

export interface UserManagementResponse {
  user_id: number;
  action: string;
  success: boolean;
  message: string;
  updated_fields?: Record<string, string | number | boolean>;
}

export interface AdminListResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Role {
  role_id: number;
  role_name: string;
  user_count: number;
}

export interface AdminFilterRequest {
  search_term?: string;
  status_filter?: string;
  role_filter?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export interface AdminAudit {
  audit_id: number;
  admin_user_id: number;
  admin_username?: string;
  action_type: string;
  target_type: string;
  target_id: number;
  action_details?: string;
  timestamp: string;
}
