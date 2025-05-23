"use client";
import { useEffect, useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  Filter,
  Calendar,
  SortAsc,
  X,
} from "lucide-react";

import { useAuth } from "@/app/features/auth/context/AuthContext";
import { DatasetCard } from "@/app/features/dataset/components/DatasetCard";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Input } from "@/app/components/atoms/input";
import { Button } from "@/app/components/atoms/button";
import { Separator } from "@/app/components/atoms/separator";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { Dataset } from "@/app/features/dataset/types/datasetTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/molecules/select";

// Dummy datasets for testing
const DUMMY_DATASETS: Dataset[] = [
  {
    dataset_id: 1,
    dataset_name: "Climate Change Data 2023",
    date_of_creation: "2023-01-15",
    dataset_last_updated: "2023-06-20",
    dataset_description:
      "Global temperature and CO2 measurements from 2000-2023",
    downloads_count: 235,
    uploader_id: 1,
    owners: [1],
  },
  {
    dataset_id: 2,
    dataset_name: "COVID-19 Statistics",
    date_of_creation: "2022-03-10",
    dataset_description: "Worldwide COVID-19 cases, recoveries, and fatalities",
    downloads_count: 782,
    uploader_id: 2,
    owners: [2, 3],
  },
  {
    dataset_id: 3,
    dataset_name: "Stock Market Analysis 2022",
    date_of_creation: "2022-12-05",
    dataset_description:
      "Historical stock data for major indices and tech companies",
    downloads_count: 547,
    uploader_id: 1,
    owners: [1, 4],
  },
  {
    dataset_id: 4,
    dataset_name: "Global Population Trends",
    date_of_creation: "2023-02-18",
    dataset_description:
      "Population data by country with growth rates and demographics",
    downloads_count: 329,
    uploader_id: 3,
    owners: [3],
  },
  {
    dataset_id: 5,
    dataset_name: "Renewable Energy Projects",
    date_of_creation: "2023-05-22",
    dataset_description: "Data on solar, wind, and hydro projects worldwide",
    downloads_count: 156,
    uploader_id: 2,
    owners: [2],
  },
  {
    dataset_id: 6,
    dataset_name: "Healthcare Spending Analysis",
    date_of_creation: "2022-09-14",
    dataset_description:
      "Comparative analysis of healthcare spending across countries",
    downloads_count: 413,
    uploader_id: 4,
    owners: [4, 1],
  },
  {
    dataset_id: 7,
    dataset_name: "Educational Outcomes Research",
    date_of_creation: "2023-04-03",
    dataset_description:
      "Student performance metrics across various educational systems",
    downloads_count: 287,
    uploader_id: 3,
    owners: [3, 2],
  },
  {
    dataset_id: 8,
    dataset_name: "Urban Transportation Data",
    date_of_creation: "2022-11-29",
    dataset_description:
      "Public transit usage and traffic patterns in major cities",
    downloads_count: 198,
    uploader_id: 1,
    owners: [1],
  },
  {
    dataset_id: 9,
    dataset_name: "E-commerce Consumer Behavior",
    date_of_creation: "2023-03-17",
    dataset_description:
      "Shopping patterns and consumer preferences in online retail",
    downloads_count: 376,
    uploader_id: 2,
    owners: [2],
  },
  {
    dataset_id: 10,
    dataset_name: "Satellite Imagery Collection",
    date_of_creation: "2022-08-05",
    dataset_description:
      "High-resolution satellite images for environmental monitoring",
    downloads_count: 524,
    uploader_id: 4,
    owners: [4],
  },
  {
    dataset_id: 11,
    dataset_name: "Social Media Usage Patterns",
    date_of_creation: "2023-01-30",
    dataset_description:
      "Analysis of user engagement across major social platforms",
    downloads_count: 632,
    uploader_id: 3,
    owners: [3, 1],
  },
  {
    dataset_id: 12,
    dataset_name: "Agricultural Yield Data",
    date_of_creation: "2022-10-12",
    dataset_description:
      "Crop yields and farming practices across different regions",
    downloads_count: 245,
    uploader_id: 2,
    owners: [2, 4],
  },
  {
    dataset_id: 13,
    dataset_name: "Ocean Temperature Readings",
    date_of_creation: "2023-06-08",
    dataset_description: "Oceanic temperature measurements from buoy networks",
    downloads_count: 189,
    uploader_id: 1,
    owners: [1],
  },
  {
    dataset_id: 14,
    dataset_name: "Mental Health Statistics",
    date_of_creation: "2022-07-20",
    dataset_description:
      "Survey data on mental health conditions and treatments",
    downloads_count: 421,
    uploader_id: 3,
    owners: [3],
  },
  {
    dataset_id: 15,
    dataset_name: "Renewable Energy Adoption",
    date_of_creation: "2023-02-14",
    dataset_description:
      "Trends in renewable energy adoption across industries",
    downloads_count: 356,
    uploader_id: 4,
    owners: [4, 2],
  },
  {
    dataset_id: 16,
    dataset_name: "Housing Market Trends",
    date_of_creation: "2022-11-05",
    dataset_description:
      "Real estate prices and market activity in major cities",
    downloads_count: 508,
    uploader_id: 1,
    owners: [1, 3],
  },
  {
    dataset_id: 17,
    dataset_name: "Air Quality Measurements",
    date_of_creation: "2023-04-22",
    dataset_description:
      "Pollution levels and air quality indices from urban areas",
    downloads_count: 274,
    uploader_id: 2,
    owners: [2],
  },
  {
    dataset_id: 18,
    dataset_name: "Cybersecurity Incidents",
    date_of_creation: "2022-12-18",
    dataset_description:
      "Anonymized data on major cybersecurity breaches and attacks",
    downloads_count: 693,
    uploader_id: 4,
    owners: [4],
  },
  {
    dataset_id: 19,
    dataset_name: "Remote Work Productivity",
    date_of_creation: "2023-03-05",
    dataset_description:
      "Comparative analysis of productivity in remote vs. office settings",
    downloads_count: 312,
    uploader_id: 3,
    owners: [3, 1],
  },
  {
    dataset_id: 20,
    dataset_name: "Biodiversity Surveys",
    date_of_creation: "2022-09-30",
    dataset_description:
      "Species diversity and ecosystem health across various biomes",
    downloads_count: 267,
    uploader_id: 2,
    owners: [2, 4],
  },
  {
    dataset_id: 21,
    dataset_name: "Vaccine Efficacy Studies",
    date_of_creation: "2023-05-11",
    dataset_description:
      "Comparative analysis of vaccine efficacy and side effects",
    downloads_count: 529,
    uploader_id: 1,
    owners: [1],
  },
  {
    dataset_id: 22,
    dataset_name: "Consumer Price Index Data",
    date_of_creation: "2022-10-24",
    dataset_description: "Historical CPI data with regional comparisons",
    downloads_count: 345,
    uploader_id: 3,
    owners: [3],
  },
  {
    dataset_id: 23,
    dataset_name: "Digital Literacy Survey",
    date_of_creation: "2023-01-19",
    dataset_description:
      "Assessment of digital skills across different demographics",
    downloads_count: 216,
    uploader_id: 2,
    owners: [2, 1],
  },
  {
    dataset_id: 24,
    dataset_name: "Renewable Water Resources",
    date_of_creation: "2022-08-17",
    dataset_description: "Freshwater availability and usage patterns globally",
    downloads_count: 183,
    uploader_id: 4,
    owners: [4],
  },
];

// Mock function to simulate API behavior with filtering and pagination
const simulateDatasetFetch = (
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  filters?: Record<string, string | number | boolean>
): Promise<{ datasets: Dataset[]; total: number; hasMore: boolean }> => {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      let filteredData = [...DUMMY_DATASETS];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter(
          (dataset) =>
            dataset.dataset_name.toLowerCase().includes(searchLower) ||
            (dataset.dataset_description &&
              dataset.dataset_description.toLowerCase().includes(searchLower))
        );
      }

      // Apply date filters
      if (filters) {
        if (filters.date_from) {
          const dateFrom = new Date(filters.date_from.toString());
          filteredData = filteredData.filter(
            (dataset) => new Date(dataset.date_of_creation) >= dateFrom
          );
        }
        if (filters.date_to) {
          const dateTo = new Date(filters.date_to.toString());
          filteredData = filteredData.filter(
            (dataset) => new Date(dataset.date_of_creation) <= dateTo
          );
        }
      }

      // Apply sorting
      if (sortBy) {
        switch (sortBy) {
          case "newest":
            filteredData.sort(
              (a, b) =>
                new Date(b.date_of_creation).getTime() -
                new Date(a.date_of_creation).getTime()
            );
            break;
          case "oldest":
            filteredData.sort(
              (a, b) =>
                new Date(a.date_of_creation).getTime() -
                new Date(b.date_of_creation).getTime()
            );
            break;
          case "downloads":
            filteredData.sort((a, b) => b.downloads_count - a.downloads_count);
            break;
          case "name_asc":
            filteredData.sort((a, b) =>
              a.dataset_name.localeCompare(b.dataset_name)
            );
            break;
          case "name_desc":
            filteredData.sort((a, b) =>
              b.dataset_name.localeCompare(a.dataset_name)
            );
            break;
        }
      }

      // Get total before pagination
      const total = filteredData.length;

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      const hasMore = endIndex < filteredData.length;

      resolve({
        datasets: paginatedData,
        total,
        hasMore,
      });
    }, 800); // Simulated network delay
  });
};

export default function SearchDatasetsPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filters, setFilters] = useState<
    Record<string, string | number | boolean>
  >({});
  const { ref: loadMoreRef, inView } = useInView();

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Apply filters when date inputs change
  useEffect(() => {
    const newFilters = { ...filters };
    if (dateFrom) newFilters.date_from = dateFrom;
    else delete newFilters.date_from;

    if (dateTo) newFilters.date_to = dateTo;
    else delete newFilters.date_to;

    setFilters(newFilters);
  }, [dateFrom, dateTo]);

  // Query to fetch datasets with infinite scrolling - using mock data
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["allDatasets", debouncedSearchQuery, sortBy, filters],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        // Use the mock function instead of real API call
        return await simulateDatasetFetch(
          pageParam,
          12, // items per page
          debouncedSearchQuery,
          sortBy,
          filters
        );
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets. Please try again.",
          variant: "error",
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !isAuthLoading,
  });

  // Trigger next page fetch when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSortBy("newest");
    setDateFrom("");
    setDateTo("");
    setFilters({});
  }, []);

  // Compute flat list of datasets from all pages
  const datasets = data?.pages.flatMap((page) => page.datasets) || [];
  const totalResults = data?.pages[0]?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Datasets</h1>

      {/* Search and filters section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end mb-6">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Sort dropdown */}
          <div className="relative min-w-40">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="downloads">Most Downloaded</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced filters button */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </div>

      {/* Collapsible filters section */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in-50 slide-in-up">
          <h2 className="text-sm font-medium mb-3">Filter Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar size={14} />
                Date Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm"
                  placeholder="To"
                />
              </div>
            </div>

            {/* Additional filters can be added here */}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-sm"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          {isLoading ? "Searching..." : `${totalResults} datasets found`}
        </p>

        {/* Show active filters */}
        {(debouncedSearchQuery || dateFrom || dateTo) && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Active filters:</span>
            {debouncedSearchQuery && (
              <span className="bg-gray-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                Search: {debouncedSearchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {dateFrom && (
              <span className="bg-gray-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                From: {dateFrom}
                <button
                  onClick={() => setDateFrom("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {dateTo && (
              <span className="bg-gray-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                To: {dateTo}
                <button
                  onClick={() => setDateTo("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Loading state */}
      {isLoading && !datasets.length ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Searching datasets...</p>
          </div>
        </div>
      ) : null}

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          <p>Failed to load datasets. Please try again later.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* No results */}
      {!isLoading && !isError && !datasets.length ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">
            No datasets match your search criteria.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      ) : null}

      {/* Results grid */}
      {datasets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <div key={dataset.dataset_id} className="group relative">
              <DatasetCard
                dataset={dataset}
                isSelected={false}
                onSelect={() => {}} // No selection needed for search page
              />
            </div>
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center mt-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Intersection observer element for infinite scroll */}
      {hasNextPage && !isFetchingNextPage && (
        <div ref={loadMoreRef} className="h-20 w-full" />
      )}
    </div>
  );
}
