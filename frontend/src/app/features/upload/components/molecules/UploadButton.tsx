import { useFileUpload } from "../../hooks/useUpload";
import { FileItem } from "../../types/file";
import { Button } from "@/app/components/atoms/button";

function UploadButton({
  files,
  setFiles,
}: {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
}) {
  const { upload } = useFileUpload(setFiles);

  async function handleUpload() {
    const filesToUpload = files.filter((f) => f.status === "idle");

    await upload(filesToUpload);
  }

  return (
    <Button onClick={handleUpload} className="mt-2">
      Upload {files.filter((f) => f.status === "idle").length} files
    </Button>
  );
}
export default UploadButton;
