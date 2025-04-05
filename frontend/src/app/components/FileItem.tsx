import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "./ui/progress";
import { formatBytes } from "@/app/lib/uploadHelpers";
import { FileItem } from "../types/file";
import RemoveButton from "./RemoveButton";

function FileItemComp({
  file,
  removeFile,
}: {
  file: FileItem;
  removeFile: (id: string) => void;
}) {
  return (
    <div
      key={file.id}
      className="flex items-center justify-between p-3 border rounded-md bg-background"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="p-2 rounded-md bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.file.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatBytes(file.file.size)}
          </p>
          {file.status === "error" && (
            <p className="text-xs text-red-500 mt-1">{file.error}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {file.status === "uploading" && (
          <div className="w-24">
            <Progress value={file.progress} className="h-2" />
          </div>
        )}

        {file.status === "success" && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}

        {file.status === "error" && (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}

        <RemoveButton
          removeFunc={removeFile}
          id={file.id}
          prefix="Remove file"
        />
      </div>
    </div>
  );
}
export default FileItemComp;
