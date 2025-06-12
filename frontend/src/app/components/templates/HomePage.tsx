"use client";
import { useAuth } from "@/app/features/auth/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/molecules/card";
import { Button } from "@/app/components/atoms/button";
import {
  FileText,
  Clock,
  Download,
  Upload,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { UploadModal } from "@/app/features/upload modal/modal";
import { createPortal } from "react-dom";

// Mock data for initial rendering - would be replaced with actual API calls
const mockFeaturedDatasets = [
  {
    id: 1,
    name: "Climate Change Dataset",
    description: "Global temperature data from 1950-2023",
    downloads: 128,
    date: "2023-12-15",
  },
  {
    id: 2,
    name: "Neural Network Training Data",
    description: "Labeled images for ML model training",
    downloads: 356,
    date: "2023-11-30",
  },
  {
    id: 3,
    name: "Genome Sequences",
    description: "Human genome sequences with annotations",
    downloads: 89,
    date: "2023-12-10",
  },
];

const mockRecentActivity = [
  {
    id: 1,
    type: "upload",
    dataset: "Economic Indicators 2023",
    user: "maria_stats",
    date: "2023-12-18",
  },
  {
    id: 2,
    type: "download",
    dataset: "Climate Change Dataset",
    user: "john_researcher",
    date: "2023-12-17",
  },
  {
    id: 3,
    type: "comment",
    dataset: "Neural Network Training Data",
    user: "ai_enthusiast",
    date: "2023-12-16",
  },
];

function HomePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  // State for statistics - would be populated from API in real implementation
  const [stats] = useState({
    totalDatasets: 124,
    myDatasets: 8,
    totalDownloads: 1465,
    recentDownloads: 57,
  });

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [token, isLoading, router]);

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

  // In a real implementation, these would be API calls to fetch data
  // useEffect(() => {
  //   async function fetchData() {
  //     // Fetch statistics, featured datasets, recent activity, etc.
  //   }
  //   fetchData();
  // }, [user.id]);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 rounded-3xl mb-12 p-8 md:p-12 lg:p-16">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full -translate-y-32 translate-x-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-200/40 to-blue-200/40 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-full translate-y-24 -translate-x-24 animate-pulse animation-delay-1000"></div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Welcome back message */}
            <div className="mb-6 animate-in fade-in-50 slide-in-up duration-700">
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
                Welcome back, {user.email.split("@")[0]}!
              </p>
            </div>

            {/* Main Tagline */}
            <div className="mb-6 animate-in fade-in-50 slide-in-up duration-700 animation-delay-200">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight mb-4">
                Your Gateway to
                <span className="inline-flex items-center ml-3">
                  Research Data
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 ml-2 animate-pulse" />
                </span>
              </h1>
            </div>

            {/* Description */}
            <div className="mb-8 animate-in fade-in-50 slide-in-up duration-700 animation-delay-400">
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Discover, share, and collaborate with the world&apos;s most
                comprehensive
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {" "}
                  research dataset repository
                </span>
                . Empowering researchers to accelerate scientific discovery.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in-50 slide-in-up duration-700 animation-delay-600">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg font-semibold rounded-xl border-0 transform hover:scale-105"
                asChild
              >
                <Link href="/datasets" className="flex items-center">
                  Explore Datasets
                  <Search className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg font-semibold rounded-xl transform hover:scale-105"
                onClick={() => setUploadModalOpen(true)}
              >
                <span className="flex items-center">
                  Upload Dataset
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in-50 slide-in-up duration-700 animation-delay-800">
              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-105">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {stats.totalDatasets}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Total Datasets
                </div>
              </div>

              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-105">
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stats.myDatasets}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Your Datasets
                </div>
              </div>

              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-105">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {stats.totalDownloads.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Total Downloads
                </div>
              </div>

              <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-105">
                <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {stats.recentDownloads}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Recent Activity
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Datasets */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Featured Datasets</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/datasets">View all</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockFeaturedDatasets.map((dataset) => (
              <Card
                key={dataset.id}
                className="transition-all hover:shadow-md hover:-translate-y-1 border-gray-200 dark:border-gray-700"
              >
                <CardHeader>
                  <CardTitle>{dataset.name}</CardTitle>
                  <CardDescription>{dataset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500">
                    <Download className="h-4 w-4 mr-1" />
                    <span>{dataset.downloads} downloads</span>
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{dataset.date}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="w-full"
                  >
                    <Link href={`/datasets/${dataset.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-0">
              <ul className="divide-y">
                {mockRecentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-center p-4">
                    {activity.type === "upload" && (
                      <Upload className="h-5 w-5 text-green-500 mr-3" />
                    )}
                    {activity.type === "download" && (
                      <Download className="h-5 w-5 text-blue-500 mr-3" />
                    )}
                    {activity.type === "comment" && (
                      <FileText className="h-5 w-5 text-purple-500 mr-3" />
                    )}

                    <div className="flex-1">
                      <p className="font-medium">{activity.dataset}</p>
                      <p className="text-sm text-gray-500">
                        {activity.type === "upload" && "Uploaded by "}
                        {activity.type === "download" && "Downloaded by "}
                        {activity.type === "comment" && "Commented by "}
                        <span className="font-medium">
                          {activity.user}
                        </span> on {activity.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-blue-100 p-3 mb-4">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">
                    Upload Your First Dataset
                  </h3>
                  <p className="text-sm text-gray-500">
                    Share your data with the community by uploading your first
                    dataset.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    Get Started
                  </Button>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-green-100 p-3 mb-4">
                    <Search className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">
                    Explore Available Datasets
                  </h3>
                  <p className="text-sm text-gray-500">
                    Browse through datasets uploaded by other researchers and
                    users.
                  </p>
                  <Button variant="link" size="sm" className="mt-2" asChild>
                    <Link href="/datasets">Explore Now</Link>
                  </Button>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-purple-100 p-3 mb-4">
                    <Download className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Download & Use Datasets</h3>
                  <p className="text-sm text-gray-500">
                    Download datasets for your research or applications.
                  </p>
                  <Button variant="link" size="sm" className="mt-2" asChild>
                    <Link href="/datasets">Find Datasets</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
