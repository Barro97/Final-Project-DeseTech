"use client";
import { Dataset } from "@/app/features/dataset/types/datasetTypes";
import { Card } from "@/app/components/molecules/card";
import Link from "next/link";
import { Database, Calendar, FileText } from "lucide-react";

interface DatasetCardProps {
  dataset: Dataset;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  // Format the date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  return (
    <Link href={`/datasets/${dataset.dataset_id}`} className="block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
        {/* Thumbnail placeholder - replace with actual thumbnail when available */}
        <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Database className="h-12 w-12 text-slate-400" />
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold truncate">
            {dataset.dataset_name}
          </h3>

          {dataset.dataset_description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {dataset.dataset_description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDate(dataset.date_of_creation)}</span>
            </div>

            <div className="flex items-center text-xs text-gray-500">
              <FileText className="h-3 w-3 mr-1" />
              <span>{dataset.downloads_count} downloads</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
