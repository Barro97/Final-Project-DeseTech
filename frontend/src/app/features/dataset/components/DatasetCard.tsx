"use client";
import React, { useState, useEffect } from "react";
import { Dataset } from "@/app/features/dataset/types/datasetTypes";
import { Card } from "@/app/components/molecules/card";
import Link from "next/link";
import {
  Calendar,
  DownloadIcon,
  Tag,
  ShieldCheck,
  HardDrive,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface DatasetCardProps {
  dataset: Dataset;
  isSelected: boolean;
  onSelect: () => void;
  showSelectionCheckbox?: boolean;
}

export function DatasetCard({
  dataset,
  isSelected,
  onSelect,
  showSelectionCheckbox = false,
}: DatasetCardProps) {
  const [imageStatus, setImageStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  // Reset image status if the dataset (and thus thumbnailUrl) changes
  useEffect(() => {
    if (dataset.thumbnailUrl) {
      setImageStatus("loading");
    } else {
      setImageStatus("loaded"); // Or 'error' if you want a specific icon for no-URL too
    }
  }, [dataset.thumbnailUrl]);

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

  // Get approval status styling
  const getApprovalStatusDisplay = () => {
    // Show approval status for all datasets except those without any status
    if (!dataset.approval_status) {
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
        className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${config.className}`}
      >
        <IconComponent className="h-3 w-3" />
        {config.text}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative block group",
        isSelected && showSelectionCheckbox && "ring-2 ring-blue-500 rounded-lg"
      )}
    >
      {showSelectionCheckbox && (
        <div
          onClick={handleSelectClick}
          className="absolute top-4 right-4 z-10 p-1 bg-white dark:bg-gray-800 rounded-full cursor-pointer group-hover:opacity-100 opacity-75 transition-opacity"
          aria-label={isSelected ? "Deselect dataset" : "Select dataset"}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-blue-600" />
          ) : (
            <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      )}

      {/* Approval Status Badge */}
      {getApprovalStatusDisplay()}

      <Link href={`/datasets/${dataset.dataset_id}`} className="block h-full">
        <Card className="h-full overflow-hidden border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
          {/* Thumbnail Section */}
          <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
            {!dataset.thumbnailUrl ? (
              <ImageIcon className="h-12 w-12 text-slate-400" />
            ) : imageStatus === "loading" ? (
              // Optional: You can use a Skeleton component here if you have one
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse">
                <ImageIcon className="h-12 w-12 text-slate-400 opacity-50" />
              </div>
            ) : imageStatus === "error" ? (
              <img
                src="/placeholders/placeholder-image.png"
                alt={`${dataset.dataset_name} fallback thumbnail`}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={dataset.thumbnailUrl}
                alt={`${dataset.dataset_name} thumbnail`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onLoad={() => setImageStatus("loaded")}
                onError={() => setImageStatus("error")}
              />
            )}
          </div>

          <div className="p-4 flex flex-col flex-grow">
            <h3
              className="text-lg font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200"
              title={dataset.dataset_name}
            >
              {dataset.dataset_name}
            </h3>

            {dataset.dataset_description && (
              <p
                className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2"
                title={dataset.dataset_description}
              >
                {dataset.dataset_description}
              </p>
            )}

            {/* Metadata Bar */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span>Created: {formatDate(dataset.date_of_creation)}</span>
              </div>
              {dataset.dataset_last_updated && (
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-orange-500" />
                  <span>
                    Updated: {formatDate(dataset.dataset_last_updated)}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <DownloadIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span>{dataset.downloads_count} downloads</span>
              </div>
              {dataset.size && (
                <div className="flex items-center">
                  <HardDrive className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span>Size: {dataset.size}</span>
                </div>
              )}
              {dataset.license && (
                <div className="flex items-center">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-green-600 dark:text-green-500" />
                  <span>License: {dataset.license}</span>
                </div>
              )}
              {/* Show approval info for approved datasets */}
              {dataset.approval_status === "approved" &&
                dataset.approval_date && (
                  <div className="flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-green-600 dark:text-green-500" />
                    <span>Approved: {formatDate(dataset.approval_date)}</span>
                  </div>
                )}
              {/* Geographic location */}
              {dataset.geographic_location && (
                <div className="flex items-center">
                  <svg
                    className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  <span className="truncate">
                    {dataset.geographic_location.length > 30
                      ? `${dataset.geographic_location.substring(0, 30)}...`
                      : dataset.geographic_location}
                  </span>
                </div>
              )}
              {/* Data time period */}
              {dataset.data_time_period && (
                <div className="flex items-center">
                  <svg
                    className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Period: {dataset.data_time_period}</span>
                </div>
              )}
            </div>

            {/* Tags Section */}
            {dataset.tags && dataset.tags.length > 0 && (
              <div className="mt-auto pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {dataset.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 rounded-full text-[10px] font-medium flex items-center"
                    >
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {dataset.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-[10px] font-medium">
                      +{dataset.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
}
