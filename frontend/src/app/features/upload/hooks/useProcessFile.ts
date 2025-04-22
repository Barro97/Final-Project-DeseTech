// import { useFileUpload } from "./useUpload";
import { FileItem } from "@/app/features/upload/types/file";
import { validateFile } from "@/app/features/upload/lib/uploadHelpers";

export function useProcessFile(
  maxFiles: number,
  maxSize: number,
  accept: string,
  files: FileItem[],
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  // onUpload: (files: File[]) => Promise<void>
) {
  // const { upload } = useFileUpload(setFiles);

  const processFiles = (fileList: FileList) => {
    const newFiles: FileItem[] = [];

    Array.from(fileList).forEach((file) => {
      const validation = validateFile(file, maxSize, accept);

      if (validation.valid) {
        newFiles.push({
          file,
          id: crypto.randomUUID(),
          progress: 0,
          status: "idle",
        });
      } else {
        newFiles.push({
          file,
          id: crypto.randomUUID(),
          progress: 0,
          status: "error",
          error: validation.error,
        });
      }
    });

    // Respect maxFiles limit
    const combinedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(combinedFiles);

    // Auto-upload if handler provided
    // if (onUpload) {
    //   const validFiles = combinedFiles
    //     .filter((f) => f.status !== "error")
    //     .map((f) => f.file);

    //   if (validFiles.length > 0) {
    //     upload(combinedFiles.filter((f) => f.status !== "error"));
    //     onUpload(validFiles).catch(() => {
    //       // Handle upload error
    //       setFiles((prev) =>
    //         prev.map((f) => ({
    //           ...f,
    //           status: "error",
    //           error: "Upload failed",
    //           progress: 0,
    //         }))
    //       );
    //     });
    //   }
    // }
  };

  return { processFiles };
}
