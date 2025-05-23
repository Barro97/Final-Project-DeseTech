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
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/app/components/atoms/button";
import { useToast } from "@/app/features/toaster/hooks/useToast";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([]);

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
    staleTime: 5 * 60 * 1000,
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
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedDatasetIds.length} selected dataset(s)? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(selectedDatasetIds);
    }
  };

  const handleAddDatasetClick = () => {
    const addButton = document.querySelector(
      '[data-testid="add-dataset-btn"]'
    ) as HTMLElement;
    if (addButton) {
      addButton.click();
    }
  };

  if (isLoading || isFetching || deleteMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Datasets</h1>

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

      {datasets.length === 0 && !isFetching ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">
            You haven&apos;t uploaded any datasets yet.
          </p>
          <Link
            href="#"
            onClick={handleAddDatasetClick}
            className="text-blue-500 hover:underline"
          >
            Click here to add your first dataset
          </Link>
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
    </div>
  );
}
