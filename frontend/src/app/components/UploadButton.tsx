import { useFileUpload } from "../hooks/useUpload";
import { FileItem } from "../types/file";
import { Button } from "./ui/button";

function UploadButton({
  files,
  onUpload,
}: {
  files: FileItem[];
  onUpload: (files: File[]) => Promise<void>;
}) {
  const { upload } = useFileUpload();

  return (
    <Button
      onClick={() => {
        const filesToUpload = files.filter((f) => f.status === "idle");
        upload(filesToUpload);
        if (onUpload) {
          onUpload(filesToUpload.map((f) => f.file));
        }
      }}
      className="mt-2"
    >
      Upload {files.filter((f) => f.status === "idle").length} files
    </Button>
  );
}
export default UploadButton;
