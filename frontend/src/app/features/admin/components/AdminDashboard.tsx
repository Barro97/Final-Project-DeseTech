"use client";
import React, { useState, useEffect } from "react";
import { useAdminStats } from "../hooks/useAdminData";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Card } from "@/app/components/molecules/card";
import {
  Users,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building,
  Shield,
  Target,
  Globe,
  BarChart3,
  Activity,
  Award,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className={`text-3xl font-bold ${color} mt-1`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={`flex items-center mt-2 text-xs ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}
            >
              <TrendingUp
                className={`h-3 w-3 mr-1 ${trend.direction === "down" ? "rotate-180" : ""}`}
              />
              {trend.value}% vs last month
            </div>
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

interface ProgressBarProps {
  percentage: number;
  color: string;
  label: string;
}

function ProgressBar({ percentage, color, label }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

// Skeleton Components
function SkeletonCard() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </Card>
  );
}

function SkeletonActionItems() {
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonAnalyticsCard() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SkeletonProgressBars() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SkeletonActivityList() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3"
          >
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Section visibility management
interface SectionVisibility {
  header: boolean;
  actionItems: boolean;
  mainAnalytics: boolean;
  researchIntelligence: boolean;
  dataQuality: boolean;
  collaboration: boolean;
  recentActivity: boolean;
}

export function AdminDashboard() {
  const { stats, loading, error, refetch } = useAdminStats();

  // Progressive loading state
  const [sectionsVisible, setSectionsVisible] = useState<SectionVisibility>({
    header: false,
    actionItems: false,
    mainAnalytics: false,
    researchIntelligence: false,
    dataQuality: false,
    collaboration: false,
    recentActivity: false,
  });

  // Progressive section loading
  useEffect(() => {
    if (!loading && stats) {
      // Critical sections (load immediately)
      setTimeout(() => {
        setSectionsVisible((prev) => ({ ...prev, header: true }));
      }, 0);

      setTimeout(() => {
        setSectionsVisible((prev) => ({ ...prev, actionItems: true }));
      }, 100);

      setTimeout(() => {
        setSectionsVisible((prev) => ({ ...prev, mainAnalytics: true }));
      }, 200);

      // Secondary sections (load after short delay)
      setTimeout(() => {
        setSectionsVisible((prev) => ({ ...prev, researchIntelligence: true }));
      }, 500);

      setTimeout(() => {
        setSectionsVisible((prev) => ({ ...prev, dataQuality: true }));
      }, 700);

      // Tertiary sections (load last)
      setTimeout(() => {
        setSectionsVisible((prev) => ({ ...prev, collaboration: true }));
      }, 900);

      setTimeout(() => {
        setSectionsVisible((prev) => ({ ...prev, recentActivity: true }));
      }, 1100);
    }
  }, [loading, stats]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Show skeletons immediately */}
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
          <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <SkeletonActionItems />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonAnalyticsCard />
          <SkeletonAnalyticsCard />
        </div>

        <SkeletonProgressBars />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonAnalyticsCard />
          <SkeletonAnalyticsCard />
        </div>

        <SkeletonActivityList />
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
    <div className="space-y-8">
      {/* Header */}
      <div
        className={`flex items-center justify-between transition-all duration-500 ${
          sectionsVisible.header
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Enhanced Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive analytics and platform management insights
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

      {/* Action Items - Top Priority */}
      <div
        className={`transition-all duration-500 ${
          sectionsVisible.actionItems
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        {sectionsVisible.actionItems ? (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Action Required
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pending Approvals
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.pending_datasets}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Oldest: {stats.approval_performance.oldest_pending_days}{" "}
                      days
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Approval Time
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.approval_performance.average_approval_time_days}d
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rate: {stats.approval_performance.approval_rate_30d}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Data Quality Score
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.data_quality_metrics.quality_score}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Complete metadata
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SkeletonActionItems />
        )}
      </div>

      {/* Main Analytics Grid */}
      <div
        className={`transition-all duration-500 ${
          sectionsVisible.mainAnalytics
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        {sectionsVisible.mainAnalytics ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <StatCard
              title="Active Researchers"
              value={stats.active_users}
              icon={<Users className="h-6 w-6" />}
              color="text-blue-600"
              subtitle={`${((stats.active_users / stats.total_users) * 100).toFixed(1)}% of ${stats.total_users} total`}
            />
            <StatCard
              title="Approved Datasets"
              value={stats.approved_datasets}
              icon={<CheckCircle className="h-6 w-6" />}
              color="text-green-600"
              subtitle={`${stats.datasets_this_month} added this month`}
            />
            <StatCard
              title="Unique Downloads"
              value={stats.download_analytics.unique_download_relationships}
              icon={<Download className="h-6 w-6" />}
              color="text-purple-600"
              subtitle={`${stats.download_analytics.download_conversion_rate}% conversion rate`}
            />
            <StatCard
              title="Organizations"
              value={stats.organization_analytics.unique_organizations}
              icon={<Building className="h-6 w-6" />}
              color="text-indigo-600"
              subtitle={`${stats.organization_analytics.organization_coverage_percentage}% user coverage`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
      </div>

      {/* Research Intelligence */}
      <div
        className={`transition-all duration-500 ${
          sectionsVisible.researchIntelligence
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        {sectionsVisible.researchIntelligence ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Geographic Coverage
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Geotagged Datasets
                  </span>
                  <span className="font-bold text-blue-600">
                    {stats.geographic_analytics.geographic_coverage_percentage}%
                  </span>
                </div>
                <div className="text-sm space-y-2">
                  <p>
                    <strong>
                      {stats.geographic_analytics.unique_locations}
                    </strong>{" "}
                    unique locations
                  </p>
                  <p>
                    <strong>
                      {stats.geographic_analytics.geotagged_datasets}
                    </strong>{" "}
                    geotagged datasets
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Top Locations
                  </h4>
                  {stats.geographic_analytics.top_locations
                    .slice(0, 5)
                    .map((location, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {location.location}
                        </span>
                        <span className="text-sm font-medium">
                          {location.dataset_count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>

            {/* Research Domains */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Research Domains
                </h3>
              </div>
              <div className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>
                    <strong>
                      {stats.research_domain_analytics.total_research_domains}
                    </strong>{" "}
                    research domains
                  </p>
                  <p>
                    <strong>
                      {stats.research_domain_analytics.tagged_datasets}
                    </strong>{" "}
                    tagged datasets
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    Popular Domains
                  </h4>
                  {stats.research_domain_analytics.popular_domains
                    .slice(0, 5)
                    .map((domain, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {domain.domain}
                        </span>
                        <span className="text-sm font-medium">
                          {domain.dataset_count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonAnalyticsCard />
            <SkeletonAnalyticsCard />
          </div>
        )}
      </div>

      {/* Data Quality Metrics */}
      <div
        className={`transition-all duration-500 ${
          sectionsVisible.dataQuality
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        {sectionsVisible.dataQuality ? (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Quality Metrics
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <ProgressBar
                percentage={
                  stats.data_quality_metrics.geographic_completeness.percentage
                }
                color="bg-blue-500"
                label="Geographic Data"
              />
              <ProgressBar
                percentage={
                  stats.data_quality_metrics.temporal_completeness.percentage
                }
                color="bg-green-500"
                label="Time Period Data"
              />
              <ProgressBar
                percentage={
                  stats.data_quality_metrics.tag_completeness.percentage
                }
                color="bg-purple-500"
                label="Tagged Datasets"
              />
              <ProgressBar
                percentage={
                  stats.data_quality_metrics.description_completeness.percentage
                }
                color="bg-orange-500"
                label="Descriptions"
              />
              <ProgressBar
                percentage={
                  stats.data_quality_metrics.complete_metadata.percentage
                }
                color="bg-red-500"
                label="Complete Metadata"
              />
            </div>
          </Card>
        ) : (
          <SkeletonProgressBars />
        )}
      </div>

      {/* Collaboration & Organizations */}
      <div
        className={`transition-all duration-500 ${
          sectionsVisible.collaboration
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        {sectionsVisible.collaboration ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Collaboration Patterns
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.collaboration_patterns.collaboration_rate}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Multi-owner datasets
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.collaboration_patterns.average_owners_per_dataset}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg owners/dataset
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cross-organizational:{" "}
                    {stats.collaboration_patterns.cross_org_collaboration_rate}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.collaboration_patterns.cross_organizational_datasets}{" "}
                    datasets span multiple organizations
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Download Analytics
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats.download_analytics.abuse_prevention_ratio}x
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Abuse prevention ratio
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.download_analytics.average_downloads_per_user}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg downloads/user
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recent Activity (30d):{" "}
                    {stats.download_analytics.recent_downloads_30d}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.download_analytics.datasets_with_downloads} datasets
                    have downloads
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonAnalyticsCard />
            <SkeletonAnalyticsCard />
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div
        className={`transition-all duration-500 ${
          sectionsVisible.recentActivity
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        {sectionsVisible.recentActivity ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Admin Activity
              </h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {stats.recent_activity.slice(0, 8).map((activity) => (
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
        ) : (
          <SkeletonActivityList />
        )}
      </div>
    </div>
  );
}
