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
  size?: string; // e.g., "15 MB", "2 GB"
  license?: string; // e.g., "MIT", "CC BY 4.0"
  tags?: string[]; // e.g., ["Health", "AI"]
  file_types?: string[]; // e.g., ["CSV", "JSON"]
  row_count?: number; // e.g., 10000
  approval_status?: string; // "pending", "approved", "rejected"
  approved_by?: number;
  approval_date?: string;
  // Agricultural research context fields
  geographic_location?: string; // e.g., "Kenya, Nairobi County", "Farm XYZ, coordinates: 1.2921, 36.8219"
  data_time_period?: string; // e.g., "2020-2023", "Growing season 2022", "January-March 2024"
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
