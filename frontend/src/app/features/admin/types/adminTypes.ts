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
  // Basic Statistics
  total_users: number;
  active_users: number;
  total_datasets: number;
  pending_datasets: number;
  approved_datasets: number;
  rejected_datasets: number;
  total_downloads: number;
  datasets_this_month: number;
  users_this_month: number;

  // Enhanced Analytics
  geographic_analytics: {
    geotagged_datasets: number;
    total_approved_datasets: number;
    geographic_coverage_percentage: number;
    top_locations: Array<{
      location: string;
      dataset_count: number;
    }>;
    unique_locations: number;
  };

  research_domain_analytics: {
    popular_domains: Array<{
      domain: string;
      dataset_count: number;
    }>;
    trending_domains: Array<{
      domain: string;
      recent_count: number;
    }>;
    total_research_domains: number;
    tagged_datasets: number;
  };

  organization_analytics: {
    top_contributing_organizations: Array<{
      organization: string;
      dataset_count: number;
    }>;
    organizations_by_users: Array<{
      organization: string;
      user_count: number;
    }>;
    unique_organizations: number;
    organization_coverage_percentage: number;
    users_with_organization: number;
  };

  data_quality_metrics: {
    total_approved_datasets: number;
    geographic_completeness: {
      count: number;
      percentage: number;
    };
    temporal_completeness: {
      count: number;
      percentage: number;
    };
    tag_completeness: {
      count: number;
      percentage: number;
    };
    description_completeness: {
      count: number;
      percentage: number;
    };
    complete_metadata: {
      count: number;
      percentage: number;
    };
    quality_score: number;
  };

  download_analytics: {
    unique_download_relationships: number;
    total_download_events: number;
    abuse_prevention_ratio: number;
    popular_datasets: Array<{
      name: string;
      total_downloads: number;
      unique_downloaders: number;
    }>;
    average_downloads_per_user: number;
    recent_downloads_30d: number;
    download_conversion_rate: number;
    datasets_with_downloads: number;
  };

  approval_performance: {
    pending_datasets: number;
    oldest_pending_days: number;
    approval_rate_30d: number;
    recent_approved: number;
    recent_rejected: number;
    average_approval_time_days: number;
    admin_activity_30d: Array<{
      admin: string;
      approvals: number;
    }>;
  };

  collaboration_patterns: {
    multi_owner_datasets: number;
    collaboration_rate: number;
    average_owners_per_dataset: number;
    cross_organizational_datasets: number;
    cross_org_collaboration_rate: number;
    most_collaborative_organizations: Array<{
      organization: string;
      shared_datasets: number;
    }>;
  };

  // Activity and Categories
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
