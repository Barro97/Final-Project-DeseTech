export interface Tag {
  tag_id: number;
  tag_category_name: string;
}

export interface TagCreate {
  tag_category_name: string;
}

export interface TagUpdate {
  tag_category_name: string;
}

export interface TagList {
  tags: Tag[];
  total_count: number;
}

export interface TagDeleteResponse {
  message: string;
  tag_id: number;
  datasets_affected: number;
}
