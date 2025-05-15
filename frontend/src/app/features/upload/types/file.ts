export type FileStatus = "idle" | "uploading" | "success" | "error";

export interface FileItem {
  file: File;
  id: string;
  progress: number;
  status: FileStatus;
  error?: string;
}

export interface FileUploadProps {
  maxFiles: number;
  maxSize: number; // in bytes
  accept?: string;
  onUpload: (files: File[]) => Promise<void>;
}

export type DragDropAreaProps = FileUploadProps & {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
};
