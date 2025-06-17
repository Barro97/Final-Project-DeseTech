"use client";
import React, { useState } from "react";
import { usePendingDatasets } from "../hooks/useAdminData";
import { AdminDataset, DatasetApprovalRequest } from "../types/adminTypes";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Card } from "@/app/components/molecules/card";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Download,
  FileText,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface ApprovalDialogProps {
  dataset: AdminDataset | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (
    datasetId: number,
    request: DatasetApprovalRequest
  ) => Promise<boolean>;
}

function ApprovalDialog({
  dataset,
  isOpen,
  onClose,
  onApprove,
}: ApprovalDialogProps) {
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !dataset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await onApprove(dataset.dataset_id, {
      action,
    });

    if (success) {
      setAction("approve");
      onClose();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Review Dataset
        </h3>

        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {dataset.dataset_name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {dataset.dataset_description || "No description provided"}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Uploader: {dataset.uploader_name}</span>
            <span>{dataset.file_count} files</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="approve"
                  checked={action === "approve"}
                  onChange={(e) =>
                    setAction(e.target.value as "approve" | "reject")
                  }
                  className="mr-2"
                />
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                Approve
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="reject"
                  checked={action === "reject"}
                  onChange={(e) =>
                    setAction(e.target.value as "approve" | "reject")
                  }
                  className="mr-2"
                />
                <XCircle className="h-4 w-4 text-red-600 mr-1" />
                Reject
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 min-w-[140px] h-10 flex items-center justify-center ${
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                `${action === "approve" ? "Approve" : "Reject"} Dataset`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DatasetCardProps {
  dataset: AdminDataset;
  onReview: (dataset: AdminDataset) => void;
}

function DatasetCard({ dataset, onReview }: DatasetCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href={`/datasets/${dataset.dataset_id}`}
            className="group inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <h3 className="text-lg font-semibold underline-offset-4 group-hover:underline">
              {dataset.dataset_name}
            </h3>
            <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          {dataset.dataset_description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {dataset.dataset_description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
          <Clock className="h-3 w-3" />
          Pending
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <User className="h-4 w-4" />
          <span>Uploader: {dataset.uploader_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>Created: {formatDate(dataset.date_of_creation)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="h-4 w-4" />
          <span>{dataset.file_count} files</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Download className="h-4 w-4" />
          <span>{dataset.downloads_count} downloads</span>
        </div>
      </div>

      <button
        onClick={() => onReview(dataset)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Review Dataset
      </button>
    </Card>
  );
}

export function DatasetApproval() {
  const { datasets, loading, error, refetch, handleApproval } =
    usePendingDatasets();
  const [selectedDataset, setSelectedDataset] = useState<AdminDataset | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);

  const handleReview = (dataset: AdminDataset) => {
    setSelectedDataset(dataset);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSelectedDataset(null);
  };

  const handleApprovalSubmit = async (
    datasetId: number,
    request: DatasetApprovalRequest
  ) => {
    const success = await handleApproval(datasetId, request);
    return success;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dataset Approval
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve pending datasets ({datasets.length} pending)
          </p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Datasets Grid */}
      {datasets.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No pending datasets
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All datasets have been reviewed and processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.dataset_id}
              dataset={dataset}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <ApprovalDialog
        dataset={selectedDataset}
        isOpen={showDialog}
        onClose={handleCloseDialog}
        onApprove={handleApprovalSubmit}
      />
    </div>
  );
}
