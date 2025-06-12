"use client";
import {
  getDatasetById,
  getDatasetFiles,
  downloadFile,
  deleteDataset,
  downloadDataset,
} from "@/app/features/dataset/services/datasetService";
import { approveDataset } from "@/app/features/admin/services/adminService";
import type {
  Dataset,
  DatasetFile,
} from "@/app/features/dataset/types/datasetTypes";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import {
  Database,
  Calendar,
  Download,
  FileText,
  User,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { EditDatasetDialog } from "./EditDatasetDialog";
import { FilePreview } from "@/app/features/dataset/components/FilePreview";

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPreviewFile, setCurrentPreviewFile] = useState<string | null>(
    null
  );
  const [isDownloadingDataset, setIsDownloadingDataset] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Query for dataset details
  const {
    data: dataset,
    isLoading: isDatasetLoading,
    error: datasetError,
  } = useQuery({
    queryKey: ["dataset", resolvedParams.id],
    queryFn: () => getDatasetById(resolvedParams.id) as Promise<Dataset>,
  });

  // Query for dataset files
  const { data: files = [], isLoading: isFilesLoading } = useQuery({
    queryKey: ["datasetFiles", resolvedParams.id],
    queryFn: async () => {
      try {
        return (await getDatasetFiles(resolvedParams.id)) as DatasetFile[];
      } catch (error) {
        console.error("Error fetching files:", error);
        return [] as DatasetFile[];
      }
    },
    // Don't fail the whole page if files don't load
    retry: 1,
  });

  const handleApproval = async (
    action: "approve" | "reject",
    reason?: string
  ) => {
    if (!dataset) return;

    const isApprove = action === "approve";
    const setLoading = isApprove ? setIsApproving : setIsRejecting;

    setLoading(true);
    try {
      await approveDataset(dataset.dataset_id, {
        action,
        reason,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["dataset", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["pendingDatasets"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });

      toast({
        title: "Success",
        description: `Dataset ${isApprove ? "approved" : "rejected"} successfully`,
        variant: "success",
      });
    } catch (error) {
      console.error(`Error ${action}ing dataset:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} dataset. Please try again.`,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleDownloadDataset = async () => {
    if (!dataset) return;

    setIsDownloadingDataset(true);
    try {
      const blob = await downloadDataset(resolvedParams.id);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${dataset.dataset_name}_${resolvedParams.id}.zip`;

      // Add to the DOM and click it
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Dataset "${dataset.dataset_name}" downloaded successfully`,
        variant: "success",
      });
    } catch (err) {
      console.error("Error downloading dataset:", err);
      toast({
        title: "Error",
        description: "Failed to download dataset. Please try again.",
        variant: "error",
      });
    } finally {
      setIsDownloadingDataset(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDataset(resolvedParams.id);

      setIsDeleteDialogOpen(false);

      // Invalidate both the current dataset and the user's datasets queries
      queryClient.invalidateQueries({
        queryKey: ["dataset", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["userDatasets", user?.id] });

      toast({
        title: "Success",
        description: "Dataset deleted successfully",
        variant: "success",
      });

      // Navigate back to my-datasets page
      router.push("/my-datasets");
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast({
        title: "Error",
        description: "Failed to delete dataset. Please try again.",
        variant: "error",
      });
    }
  };

  // Check if user has permission to modify (delete or edit)
  const canModify =
    user &&
    (user.role === "admin" ||
      (dataset &&
        (dataset.uploader_id === parseInt(user.id) ||
          dataset.owners.includes(parseInt(user.id)))));

  // Check if user is admin and dataset is pending
  const canApprove =
    user?.role === "admin" && dataset?.approval_status === "pending";

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Get approval status display
  const getApprovalStatusDisplay = () => {
    if (!dataset?.approval_status) {
      return null;
    }

    const statusConfig = {
      pending: {
        icon: Clock,
        text: "Pending Approval",
        className:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      },
      approved: {
        icon: CheckCircle,
        text: "Approved",
        className:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      },
      rejected: {
        icon: XCircle,
        text: "Rejected",
        className:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      },
    };

    const config =
      statusConfig[dataset.approval_status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium border ${config.className}`}
      >
        <IconComponent className="h-4 w-4" />
        {config.text}
      </div>
    );
  };

  // Show loading spinner while either dataset or files are loading
  if (isDatasetLoading || isFilesLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading dataset details...</p>
        </div>
      </div>
    );
  }

  // Show error if dataset couldn't be loaded
  if (datasetError || !dataset) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          <p>Failed to load dataset. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Safely cast files to the correct type
  const datasetFiles = files as DatasetFile[];

  return (
    <>
      {dataset && (
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          datasetName={dataset.dataset_name}
        />
      )}

      {dataset && (
        <EditDatasetDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          dataset={dataset}
          files={datasetFiles}
          datasetId={resolvedParams.id}
        />
      )}

      <div className="container mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{dataset.dataset_name}</h1>
                  {getApprovalStatusDisplay()}
                </div>

                {/* Admin approval notice */}
                {canApprove && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        Admin Review Required
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      This dataset is pending approval. Review the content and
                      approve or reject it.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproval("approve")}
                        disabled={isApproving}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {isApproving ? "Approving..." : "Approve Dataset"}
                      </button>
                      <button
                        onClick={() =>
                          handleApproval(
                            "reject",
                            "Content does not meet guidelines"
                          )
                        }
                        disabled={isRejecting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-md flex items-center gap-2 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        {isRejecting ? "Rejecting..." : "Reject Dataset"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Approved dataset notice */}
                {dataset.approval_status === "approved" &&
                  dataset.approval_date && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          ✅ Approved Dataset
                        </span>
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        <p>
                          This dataset has been reviewed and approved by our
                          administrators.
                        </p>
                        <p className="mt-1">
                          <span className="font-medium">Approved on:</span>{" "}
                          {formatDate(dataset.approval_date)}
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {canModify && (
                <div className="flex space-x-3 ml-4">
                  <button
                    onClick={() => setIsEditDialogOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors"
                    aria-label="Edit dataset"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Dataset
                  </button>
                  <button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2 transition-colors"
                    aria-label="Delete dataset"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Dataset
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Created: {formatDate(dataset.date_of_creation)}</span>
              </div>

              {dataset.dataset_last_updated && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>
                    Last updated: {formatDate(dataset.dataset_last_updated)}
                  </span>
                </div>
              )}

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <User className="w-5 h-5 mr-2" />
                <span>Uploaded by: {user?.email}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Database className="w-5 h-5 mr-2" />
                <span>
                  {datasetFiles.length} file
                  {datasetFiles.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Show approval info for approved datasets */}
              {dataset.approval_status === "approved" &&
                dataset.approval_date && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Approved: {formatDate(dataset.approval_date)}</span>
                  </div>
                )}

              {/* Geographic Location */}
              {dataset.geographic_location && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Location: {dataset.geographic_location}</span>
                </div>
              )}

              {/* Data Time Period */}
              {dataset.data_time_period && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Data Period: {dataset.data_time_period}</span>
                </div>
              )}
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Files</h2>
                {datasetFiles.length > 0 && (
                  <button
                    onClick={handleDownloadDataset}
                    disabled={isDownloadingDataset}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-md flex items-center gap-2 transition-colors"
                    aria-label="Download entire dataset as zip"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloadingDataset
                      ? "Preparing Download..."
                      : "Download Dataset (ZIP)"}
                  </button>
                )}
              </div>

              {datasetFiles.length === 0 ? (
                <p className="text-gray-500">No files in this dataset.</p>
              ) : (
                <>
                  {/* File list */}
                  <div className="border rounded-md divide-y overflow-hidden mb-6">
                    {datasetFiles.map((file: DatasetFile) => (
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

                  {/* File preview */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">File Preview</h3>
                    {currentPreviewFile && (
                      <p className="text-sm text-gray-500 mb-4">
                        Currently viewing: {currentPreviewFile}
                      </p>
                    )}
                    <FilePreview
                      files={datasetFiles}
                      onFileChange={setCurrentPreviewFile}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
