"use client";
import { Dataset } from "@/app/features/dataset/types/datasetTypes";
import { Card } from "@/app/components/molecules/card";
import Link from "next/link";
import {
  Database,
  Calendar,
  FileText,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface DatasetCardProps {
  dataset: Dataset;
  isSelected: boolean;
  onSelect: () => void;
}

export function DatasetCard({
  dataset,
  isSelected,
  onSelect,
}: DatasetCardProps) {
  // Format the date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Prevent navigation when clicking the checkbox/selection area
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling to parent Link
    e.preventDefault(); // Prevent default Link behavior
    onSelect();
  };

  return (
    <div
      className={cn(
        "relative block group",
        isSelected && "ring-2 ring-blue-500 rounded-lg"
      )}
    >
      <div
        onClick={handleSelectClick}
        className="absolute top-2 right-2 z-10 p-1 bg-white dark:bg-gray-800 rounded-full cursor-pointer group-hover:opacity-100 opacity-75 transition-opacity"
        aria-label={isSelected ? "Deselect dataset" : "Select dataset"}
      >
        {isSelected ? (
          <CheckSquare className="h-5 w-5 text-blue-600" />
        ) : (
          <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <Link href={`/datasets/${dataset.dataset_id}`} className="block">
        <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-md group-hover:translate-y-[-2px]">
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
    </div>
  );
}
