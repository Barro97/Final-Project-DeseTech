// import { useState } from "react";
import { useCallback } from "react";
import { FileItem } from "../types/file";
import axios from "axios";
import { useToast } from "./useToast";

export function useFileUpload(
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
) {
  const { toast } = useToast();
  const upload = useCallback(
    // useCallback allows to use the upload function without creating it each time the component is rendered, good for better runtime

    async (filesToUpload: FileItem[]) => {
      // Defining the actual function

      const fileIds = filesToUpload.map((f) => f.id); // Isolate the ids of the expected files

      setFiles(
        (
          prev // Set those files based on their id and change their status to track their progress
        ) =>
          prev.map((f) =>
            fileIds.includes(f.id)
              ? { ...f, status: "uploading", progress: 0 }
              : f
          )
      );

      for (const fileItem of filesToUpload) {
        const formData = new FormData();
        formData.append("file", fileItem.file);
        formData.append("dataset_id", "0"); // IMPORTANT: id 0 is only for testing the uploaded file, needs to be replaced in the future

        try {
          await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND}/upload-file/`,
            formData,
            {
              onUploadProgress: (progressEvent) => {
                const total = progressEvent.total;
                const current = progressEvent.loaded;

                const percentCompleted = total
                  ? Math.round((current * 100) / total)
                  : 0;

                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileItem.id
                      ? {
                          ...f,
                          progress: percentCompleted,
                        }
                      : f
                  )
                );
              },
            }
          );
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: "success",
                    progress: 100,
                  }
                : f
            )
          );
          toast({
            title: `Success!`,
            description: `${fileItem.file.name} was uploaded successfully`,
            variant: "success",
          });
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                  }
                : f
            )
          );
          toast({
            title: `Oops!`,
            description: `An error occurred while uploading ${fileItem.file.name}, please try again`,
            variant: "error",
          });
        }
      }
    },
    [setFiles, toast]
  );
  return { upload };
}
