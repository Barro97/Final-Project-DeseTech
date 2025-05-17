export interface Dataset {
  dataset_id: number;
  dataset_name: string;
  date_of_creation: string;
  dataset_last_updated?: string;
  dataset_description?: string;
  downloads_count: number;
  uploader_id: number;
  owners: number[];
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
