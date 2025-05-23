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
  Database,
  FileText,
  TrendingUp,
  Clock,
  Download,
  Upload,
  Search,
} from "lucide-react";
import Link from "next/link";

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
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.email.split("@")[0]}!
        </h1>
        <p className="mt-2 text-gray-600">
          Discover, share and manage your datasets all in one place.
        </p>
      </div>

      {/* Statistics Cards */}
      <h2 className="text-xl font-semibold mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardDescription>Total Datasets</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              {stats.totalDatasets}
              <Database className="ml-2 h-5 w-5 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Platform-wide datasets
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardDescription>My Datasets</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              {stats.myDatasets}
              <FileText className="ml-2 h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Datasets you&apos;ve uploaded
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardDescription>Total Downloads</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              {stats.totalDownloads}
              <Download className="ml-2 h-5 w-5 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cumulative downloads
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardDescription>Recent Downloads</CardDescription>
            <CardTitle className="text-3xl flex items-center">
              {stats.recentDownloads}
              <TrendingUp className="ml-2 h-5 w-5 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
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
                <Button size="sm" variant="outline" asChild className="w-full">
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
                <h3 className="font-medium mb-2">Upload Your First Dataset</h3>
                <p className="text-sm text-gray-500">
                  Share your data with the community by uploading your first
                  dataset.
                </p>
                <Button variant="link" size="sm" className="mt-2" asChild>
                  <Link href="/upload">Get Started</Link>
                </Button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium mb-2">Explore Available Datasets</h3>
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
  );
}

export default HomePage;
