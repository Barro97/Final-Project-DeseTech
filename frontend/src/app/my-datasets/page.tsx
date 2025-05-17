"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { getUserDatasets } from "@/app/features/dataset/services/datasetService";
import type { Dataset } from "@/app/features/dataset/types/datasetTypes";
import { DatasetCard } from "@/app/features/dataset/components/DatasetCard";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export default function MyDatasetsPage() {
  const { user } = useAuth();

  // Convert to React Query
  const {
    data: datasets = [] as Dataset[],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userDatasets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Dataset[];
      return getUserDatasets(user.id);
    },
    enabled: !!user?.id, // Only run the query if we have a user ID
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const handleAddDatasetClick = () => {
    const addButton = document.querySelector(
      '[data-testid="add-dataset-btn"]'
    ) as HTMLElement;
    if (addButton) {
      addButton.click();
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
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

      {datasets.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.dataset_id} dataset={dataset} />
          ))}
        </div>
      )}
    </div>
  );
}
