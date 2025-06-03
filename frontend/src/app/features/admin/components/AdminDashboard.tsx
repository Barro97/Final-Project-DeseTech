"use client";
import React from "react";
import { useAdminStats } from "../hooks/useAdminData";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Card } from "@/app/components/molecules/card";
import {
  Users,
  Database,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className={`text-3xl font-bold ${color}`}>
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-full ${color.replace("text-", "bg-").replace("-600", "-100")} ${color.replace("text-", "text-")}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function AdminDashboard() {
  const { stats, loading, error, refetch } = useAdminStats();

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

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of platform statistics and activity
          </p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* User Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={<Users className="h-6 w-6" />}
            color="text-blue-600"
          />
          <StatCard
            title="Active Users"
            value={stats.active_users}
            icon={<CheckCircle className="h-6 w-6" />}
            color="text-green-600"
            subtitle={`${((stats.active_users / stats.total_users) * 100).toFixed(1)}% of total`}
          />
          <StatCard
            title="New This Month"
            value={stats.users_this_month}
            icon={<Calendar className="h-6 w-6" />}
            color="text-purple-600"
          />
        </div>
      </div>

      {/* Dataset Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dataset Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Datasets"
            value={stats.total_datasets}
            icon={<Database className="h-6 w-6" />}
            color="text-blue-600"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending_datasets}
            icon={<Clock className="h-6 w-6" />}
            color="text-yellow-600"
          />
          <StatCard
            title="Approved"
            value={stats.approved_datasets}
            icon={<CheckCircle className="h-6 w-6" />}
            color="text-green-600"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected_datasets}
            icon={<XCircle className="h-6 w-6" />}
            color="text-red-600"
          />
        </div>
      </div>

      {/* Download Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Activity Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Downloads"
            value={stats.total_downloads}
            icon={<Download className="h-6 w-6" />}
            color="text-indigo-600"
          />
          <StatCard
            title="Datasets This Month"
            value={stats.datasets_this_month}
            icon={<Calendar className="h-6 w-6" />}
            color="text-purple-600"
          />
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recent_activity && stats.recent_activity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <Card className="p-6">
            <div className="space-y-4">
              {stats.recent_activity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.details}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Popular Categories */}
      {stats.popular_categories && stats.popular_categories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Popular Categories
          </h2>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.popular_categories.slice(0, 6).map((category) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.category}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {category.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
