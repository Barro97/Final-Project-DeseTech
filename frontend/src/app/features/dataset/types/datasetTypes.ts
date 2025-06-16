export interface Dataset {
  dataset_id: number;
  dataset_name: string;
  date_of_creation: string;
  dataset_last_updated?: string;
  dataset_description?: string;
  downloads_count: number;
  uploader_id: number;
  owners: number[];
  thumbnailUrl?: string;
  size?: string; // e.g., "15 MB", "2 GB" - NOT BACKED BY DATABASE
  license?: string; // e.g., "MIT", "CC BY 4.0" - NOT BACKED BY DATABASE
  tags?: string[]; // e.g., ["Health", "AI"]
  file_types?: string[]; // e.g., ["CSV", "JSON"] - NOT BACKED BY DATABASE
  row_count?: number; // e.g., 10000 - NOT BACKED BY DATABASE
  approval_status?: string; // "pending", "approved", "rejected"
  approved_by?: number;
  approved_by_name?: string;
  approval_date?: string;
  // Agricultural research context fields
  geographic_location?: string; // e.g., "Kenya, Nairobi County", "Farm XYZ, coordinates: 1.2921, 36.8219"
  data_time_period?: string; // e.g., "2020-2023", "Growing season 2022", "January-March 2024"
}

// Search filters interface matching backend DatasetFilterRequest
export interface SearchFilters {
  search_term?: string;
  tags?: string[];
  uploader_id?: number;
  date_from?: string; // ISO date string
  date_to?: string; // ISO date string
  sort_by?: "newest" | "oldest" | "downloads" | "name";
  page?: number;
  limit?: number;
  // Tier 1 filters
  file_types?: string[];
  has_location?: boolean;
  min_downloads?: number;
  max_downloads?: number;
  // Approval status filter
  approval_status?: string[];
}

// Backend response format for search
export interface SearchResponse {
  datasets: Dataset[];
  total_count: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// Frontend expected format for infinite scroll
export interface SearchResult {
  datasets: Dataset[];
  total: number;
  hasMore: boolean;
}

export interface PublicStats {
  total_datasets: number;
  total_researchers: number;
  total_downloads: number;
}

export interface DatasetFile {
  file_id: number;
  file_date_of_upload: string;
  file_name: string;
  file_type?: string;
  size?: number;
  file_url: string;
  dataset_id: number;
}
