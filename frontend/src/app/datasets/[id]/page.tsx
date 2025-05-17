"use client";
import { useEffect, useState } from "react";
import {
  getDatasetById,
  getDatasetFiles,
  downloadFile,
} from "@/app/features/dataset/services/datasetService";
import {
  Dataset,
  DatasetFile,
} from "@/app/features/dataset/types/datasetTypes";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { Database, Calendar, Download, FileText, User } from "lucide-react";
import { useToast } from "@/app/features/toaster/hooks/useToast";

export default function DatasetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [files, setFiles] = useState<DatasetFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setIsLoading(true);
        const datasetData = await getDatasetById(params.id);
        setDataset(datasetData);

        try {
          const filesData = await getDatasetFiles(params.id);
          setFiles(filesData);
        } catch (fileError) {
          console.error("Error fetching files:", fileError);
          // Don't set the main error state, just log it
        }
      } catch (err) {
        console.error("Error fetching dataset:", err);
        setError("Failed to load dataset. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataset();
  }, [params.id]);

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const blob = await downloadFile(fileId);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;

      // Add to the DOM and click it
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `${fileName} downloaded successfully`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error downloading file:", err);
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "error",
      });
    }
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          <p>{error || "Dataset not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold">{dataset.dataset_name}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Created: {formatDate(dataset.date_of_creation)}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <User className="w-5 h-5 mr-2" />
              <span>Uploader ID: {dataset.uploader_id}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Database className="w-5 h-5 mr-2" />
              <span>
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {dataset.dataset_description && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 dark:text-gray-300">
                {dataset.dataset_description}
              </p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Files</h2>

            {files.length === 0 ? (
              <p className="text-gray-500">No files in this dataset.</p>
            ) : (
              <div className="border rounded-md divide-y overflow-hidden">
                {files.map((file) => (
                  <div
                    key={file.file_id}
                    className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>
                            {file.size
                              ? `${Math.round(file.size / 1024)} KB`
                              : "Size unknown"}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            Uploaded: {formatDate(file.file_date_of_upload)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleDownload(file.file_id, file.file_name)
                      }
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                      aria-label="Download file"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
