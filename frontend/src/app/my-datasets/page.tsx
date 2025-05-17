"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { getUserDatasets } from "@/app/features/dataset/services/datasetService";
import { Dataset } from "@/app/features/dataset/types/datasetTypes";
import { DatasetCard } from "@/app/features/dataset/components/DatasetCard";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";

export default function MyDatasetsPage() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const data = await getUserDatasets(user.id);
        setDatasets(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching datasets:", err);
        setError("Failed to load datasets. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasets();
  }, [user?.id]);

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
          <p>{error}</p>
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
            You haven't uploaded any datasets yet.
          </p>
          <a
            href="#"
            onClick={handleAddDatasetClick}
            className="text-blue-500 hover:underline"
          >
            Click here to add your first dataset
          </a>
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
