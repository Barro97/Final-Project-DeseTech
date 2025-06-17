"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Button } from "@/app/components/atoms/button";
import { Upload, Search, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { UploadModal } from "@/app/features/upload modal/modal";
import { createPortal } from "react-dom";
import { usePublicStats } from "@/app/features/dataset/hooks/usePublicStats";
import { useQuery } from "@tanstack/react-query";
import { searchDatasets } from "@/app/features/dataset/services/datasetService";
import { DatasetCard } from "@/app/features/dataset/components/DatasetCard";
import { Dataset } from "@/app/features/dataset/types/datasetTypes";

// Featured Datasets Component - similar to DatasetCarouselSectionPlaceholder from search page
const FeaturedDatasets = ({
  title,
  onSeeAll,
  datasets,
  isLoading,
}: {
  title: string;
  onSeeAll: () => void;
  datasets: Dataset[];
  isLoading?: boolean;
}) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSeeAll}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        View all &rarr;
      </Button>
    </div>
    {isLoading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((dataset) => (
          <DatasetCard
            key={dataset.dataset_id}
            dataset={dataset}
            isSelected={false}
            onSelect={() => {}}
            showSelectionCheckbox={false}
          />
        ))}
      </div>
    )}
  </div>
);

function HomePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch real statistics from backend
  const { stats, loading: statsLoading, error: statsError } = usePublicStats();

  // Fetch featured datasets (most downloaded)
  const { data: featuredDatasetsData, isLoading: isLoadingFeatured } = useQuery(
    {
      queryKey: ["datasets", "featured"],
      queryFn: () => searchDatasets({ sort_by: "downloads", limit: 3 }),
      enabled: !isLoading,
    }
  );

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [token, isLoading, router]);

  // Debug: Log user object to see what's available
  useEffect(() => {
    if (user) {
      console.log("User object:", user);
      console.log("First name:", user.first_name);
      console.log("Last name:", user.last_name);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        Redirecting to login...
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/50 dark:via-slate-900 dark:to-purple-950/50 rounded-3xl px-8 py-16 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-[0.03] dark:opacity-[0.05]">
            <div className="w-96 h-96 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
          </div>
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-[0.03] dark:opacity-[0.05]">
            <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Greeting */}
            <div className="mb-6 animate-in fade-in-50 slide-in-up duration-700">
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                Welcome,{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.first_name ||
                      user.last_name ||
                      user.email.split("@")[0]}
                </span>
              </p>
            </div>

            {/* Main Tagline */}
            <div className="mb-6 animate-in fade-in-50 slide-in-up duration-700 animation-delay-200">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Your Gateway to
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  Research Data
                </span>
              </h1>
            </div>

            {/* Description */}
            <div className="mb-8 animate-in fade-in-50 slide-in-up duration-700 animation-delay-400">
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Discover, share, and collaborate with a comprehensive
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {" "}
                  research dataset repository
                </span>
                . Empowering researchers to accelerate scientific discovery and
                technological innovation.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mb-12 animate-in fade-in-50 slide-in-up duration-700 animation-delay-600">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link href="/datasets">
                    <Search className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    Explore Datasets
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-105"
                  onClick={() => setUploadModalOpen(true)}
                >
                  <Upload className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-1" />
                  Upload Dataset
                  <Sparkles className="ml-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                </Button>
              </div>
            </div>

            {/* Platform Statistics */}
            <div className="animate-in fade-in-50 slide-in-up duration-700 animation-delay-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                {statsLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-8 w-20 mx-auto mb-2"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-24 mx-auto"></div>
                    </div>
                  ))
                ) : statsError ? (
                  // Error state
                  <div className="col-span-1 md:col-span-3 text-center">
                    <p className="text-red-500 dark:text-red-400 text-sm">
                      Unable to load statistics
                    </p>
                  </div>
                ) : stats ? (
                  // Real statistics
                  <>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {stats.total_datasets.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Total Datasets
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {stats.total_researchers.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Total Researchers
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {stats.total_downloads.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Total Downloads
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Datasets */}
        <FeaturedDatasets
          title="Featured Datasets"
          onSeeAll={() => router.push("/datasets")}
          datasets={featuredDatasetsData?.datasets || []}
          isLoading={isLoadingFeatured}
        />

        {/* How It Works */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1: Upload a Dataset */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-4 mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Upload a Dataset
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Share your research data with rich metadata including geographic
                location, time periods, and comprehensive descriptions to help
                others discover and understand your work.
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                onClick={() => setUploadModalOpen(true)}
              >
                Start Uploading →
              </Button>
            </div>

            {/* Step 2: Explore Others' Work */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-4 mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Explore Others&apos; Work
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Discover datasets through intelligent search, filtering by tags,
                file types, geographic regions, and time periods. Preview data
                before downloading.
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-4 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                asChild
              >
                <Link href="/datasets">Browse Datasets →</Link>
              </Button>
            </div>

            {/* Step 3: Collaborate and Grow */}
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-4 mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Collaborate and Grow
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Build on others&apos; research, contribute to the scientific
                community, and accelerate discovery through shared knowledge and
                collaborative datasets.
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-4 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                asChild
              >
                <Link href="/profile">View Your Profile →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal - Rendered outside the main container using createPortal */}
      {typeof window !== "undefined" &&
        createPortal(
          <UploadModal open={uploadModalOpen} setOpen={setUploadModalOpen} />,
          document.body
        )}
    </>
  );
}

export default HomePage;
