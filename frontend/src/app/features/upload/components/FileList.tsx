import { FileItem } from "../types/file";
import FileItemComp from "./FileItem";
import UploadButton from "./UploadButton";

function FileList({
  files,
  onUpload,
  setFiles,
}: {
  files: FileItem[];
  onUpload: (files: File[]) => Promise<void>;
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}) {
  const removeFile = (id: string) => {
    setFiles(files.filter((file) => file.id !== id));
  };

  return (
    <div className="mt-4 space-y-3">
      {files.map((file) => (
        <FileItemComp file={file} removeFile={removeFile} key={file.id} />
      ))}

      {files.some((f) => f.status === "idle") && (
        <UploadButton files={files} onUpload={onUpload} setFiles={setFiles} />
      )}
    </div>
  );
}
export default FileList;
