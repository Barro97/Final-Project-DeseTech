"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import {
  getUserDatasets,
  deleteDatasets as deleteDatasetsService,
  BatchDeleteResponse,
} from "@/app/features/dataset/services/datasetService";
import type { Dataset } from "@/app/features/dataset/types/datasetTypes";
import { DatasetCard } from "@/app/features/dataset/components/DatasetCard";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/app/components/atoms/button";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { BatchDeleteConfirmationDialog } from "./BatchDeleteConfirmationDialog";

interface ApiError {
  response?: {
    data?: {
      detail?:
        | string
        | {
            message?: string;
            errors?: Array<{ dataset_id: number; error: string }>;
          };
    };
  };
  message?: string;
}

export default function MyDatasetsPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: datasets = [] as Dataset[],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["userDatasets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Dataset[];
      return getUserDatasets(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false,
  });

  const deleteMutation = useMutation<BatchDeleteResponse, ApiError, number[]>({
    mutationFn: (datasetIds: number[]) => deleteDatasetsService(datasetIds),
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description:
          data.message ||
          `${variables.length} dataset(s) deletion process initiated.`,
        variant: "success",
      });
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((err) => {
          toast({
            title: `Deletion Error (ID: ${err.dataset_id})`,
            description: err.error,
            variant: "warning",
          });
        });
      }
      queryClient.invalidateQueries({ queryKey: ["userDatasets", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["allDatasets"] });
      setSelectedDatasetIds([]);
    },
    onError: (error: ApiError, variables) => {
      let errorMessage = `Failed to delete ${variables.length} dataset(s). Please try again.`;
      if (typeof error.response?.data?.detail === "string") {
        errorMessage = error.response.data.detail;
      } else if (typeof error.response?.data?.detail?.message === "string") {
        errorMessage = error.response.data.detail.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    },
  });

  const handleSelectDataset = (datasetId: number) => {
    setSelectedDatasetIds((prevSelectedIds) =>
      prevSelectedIds.includes(datasetId)
        ? prevSelectedIds.filter((id) => id !== datasetId)
        : [...prevSelectedIds, datasetId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedDatasetIds.length === 0) {
      toast({
        title: "No datasets selected",
        description: "Please select at least one dataset to delete.",
        variant: "info",
      });
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedDatasetIds);
    setIsDeleteDialogOpen(false);
  };

  // Show loading for auth, initial data fetch, or delete operation
  if (isUserLoading || isLoading || isFetching || deleteMutation.isPending) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-40">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">
            {deleteMutation.isPending
              ? "Deleting datasets..."
              : "Loading your datasets..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          <p>Failed to load datasets. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative min-h-[80vh]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">My Datasets</h1>
          {isFetching && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["userDatasets", user?.id],
            })
          }
          disabled={isFetching}
          className="text-sm"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {selectedDatasetIds.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={handleDeleteSelected}
            variant="destructive"
            disabled={deleteMutation.isPending}
          >
            Delete Selected ({selectedDatasetIds.length})
          </Button>
        </div>
      )}

      {datasets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">
            You haven&apos;t uploaded any datasets yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.dataset_id}
              dataset={dataset}
              isSelected={selectedDatasetIds.includes(dataset.dataset_id)}
              onSelect={() => handleSelectDataset(dataset.dataset_id)}
              showSelectionCheckbox={true}
            />
          ))}
        </div>
      )}

      <BatchDeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        selectedCount={selectedDatasetIds.length}
      />
    </div>
  );
}
