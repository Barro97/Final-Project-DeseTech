"use client";
import { useEffect, useState, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  Search as SearchIcon,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";

import { useAuth } from "@/app/features/auth/context/AuthContext";
import { DatasetCard } from "@/app/features/dataset/components/DatasetCard";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Input } from "@/app/components/atoms/input";
import { Button } from "@/app/components/atoms/button";
import { Separator } from "@/app/components/atoms/separator";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { useTags } from "@/app/features/tag/hooks/useTags";
import {
  Dataset,
  SearchFilters,
} from "@/app/features/dataset/types/datasetTypes";
import { searchDatasets } from "@/app/features/dataset/services/datasetService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/molecules/select";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from "@/app/components/molecules/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const EnhancedSearchBarPlaceholder = ({
  onSearch,
  initialQuery = "",
}: {
  onSearch: (query: string) => void;
  initialQuery?: string;
}) => {
  const [inputValue, setInputValue] = useState(initialQuery);
  const suggestions = [
    "Climate",
    "Finance",
    "Open Data",
    "Health",
    "AI",
    "Agriculture",
  ];
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = () => {
    onSearch(inputValue);
    setShowSuggestions(false);
  };

  return (
    <div className="p-4 my-4 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for datasets (e.g., Climate, Finance)..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full pl-12 pr-4 py-3 text-lg border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue("");
              setShowSuggestions(false);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={20} />
          </button>
        )}
      </div>
      {showSuggestions && inputValue && (
        <div className="relative">
          <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            {suggestions
              .filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()))
              .map((suggestion) => (
                <li
                  key={suggestion}
                  onClick={() => {
                    setInputValue(suggestion);
                    onSearch(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                >
                  {suggestion}
                </li>
              ))}
            {suggestions.filter((s) =>
              s.toLowerCase().includes(inputValue.toLowerCase())
            ).length === 0 && (
              <li className="px-4 py-2 text-gray-500">No suggestions found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const DatasetCarouselSectionPlaceholder = ({
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
  <div className="p-4 my-6">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </h2>
      <Button
        variant="link"
        onClick={onSeeAll}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        See all &rarr;
      </Button>
    </div>
    {isLoading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

const FilterPanelPlaceholder = ({
  appliedFilters,
  onFilterChange,
}: {
  appliedFilters: SearchFilters;
  onFilterChange: (
    filterKey: keyof SearchFilters,
    value: string | string[] | boolean | number | undefined
  ) => void;
}) => {
  // Fetch real tags from database
  const { data: tagsData, isLoading: isLoadingTags } = useTags();
  const availableTags = tagsData?.tags || [];

  // Common file types for filtering
  const fileTypeOptions = [
    "csv",
    "json",
    "xlsx",
    "pdf",
    "txt",
    "xml",
    "zip",
    "sql",
    "parquet",
  ];

  const handleCheckboxChange = (
    filterKey: "tags" | "file_types",
    value: string,
    checked: boolean
  ) => {
    const currentFilterValues = appliedFilters[filterKey];
    let newValuesArray: string[];

    const currentArray = (
      Array.isArray(currentFilterValues)
        ? currentFilterValues
        : currentFilterValues
          ? [String(currentFilterValues)]
          : []
    ) as string[];

    if (checked) {
      newValuesArray = [...currentArray, value].filter(
        (val, idx, self) => self.indexOf(val) === idx
      );
    } else {
      newValuesArray = currentArray.filter((v) => v !== value);
    }
    onFilterChange(filterKey, newValuesArray);
  };

  const handleDateChange = (
    filterKey: "date_from" | "date_to",
    value: string
  ) => {
    onFilterChange(filterKey, value);
  };

  const handleNumberChange = (
    filterKey: "min_downloads" | "max_downloads",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    if (numValue !== undefined && !isNaN(numValue)) {
      onFilterChange(filterKey, numValue);
    } else if (value === "") {
      onFilterChange(filterKey, undefined);
    }
  };

  const handleLocationToggle = (checked: boolean) => {
    onFilterChange("has_location", checked);
  };

  const renderFilterGroup = (
    title: string,
    filterKey: "tags" | "file_types",
    options: ReadonlyArray<string>,
    isLoading?: boolean
  ) => (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {title}
      </h3>
      {isLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {options.map((option) => {
            const currentSelected = appliedFilters[filterKey];
            let isChecked = false;
            if (Array.isArray(currentSelected)) {
              isChecked = (currentSelected as string[]).includes(option);
            }
            return (
              <label
                key={option}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:checked:bg-blue-500"
                  checked={isChecked}
                  onChange={(e) =>
                    handleCheckboxChange(filterKey, option, e.target.checked)
                  }
                />
                <span className="capitalize">{option}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
      {renderFilterGroup(
        "Tags",
        "tags",
        availableTags.map((tag) => tag.tag_category_name),
        isLoadingTags
      )}

      {renderFilterGroup("File Types", "file_types", fileTypeOptions)}

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Geographic Data
        </h3>
        <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:checked:bg-blue-500"
            checked={appliedFilters.has_location || false}
            onChange={(e) => handleLocationToggle(e.target.checked)}
          />
          <span>Has location data</span>
        </label>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Download Count Range
        </h3>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Min downloads"
            className="w-full"
            min="0"
            value={appliedFilters.min_downloads || ""}
            onChange={(e) =>
              handleNumberChange("min_downloads", e.target.value)
            }
          />
          <Input
            type="number"
            placeholder="Max downloads"
            className="w-full"
            min="0"
            value={appliedFilters.max_downloads || ""}
            onChange={(e) =>
              handleNumberChange("max_downloads", e.target.value)
            }
          />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Creation Date Range
        </h3>
        <Input
          type="date"
          placeholder="From"
          className="mb-2 w-full"
          onChange={(e) => handleDateChange("date_from", e.target.value)}
          value={appliedFilters.date_from || ""}
        />
        <Input
          type="date"
          placeholder="To"
          className="w-full"
          onChange={(e) => handleDateChange("date_to", e.target.value)}
          value={appliedFilters.date_to || ""}
        />
      </div>
    </div>
  );
};

const FilterChipsDisplayPlaceholder = ({
  activeFilters,
  onRemoveFilter,
}: {
  activeFilters: SearchFilters;
  onRemoveFilter: (
    filterKey: keyof SearchFilters,
    valueToRemove?: string
  ) => void;
}) => (
  <div className="py-2 my-2 flex flex-wrap gap-2 items-center">
    {Object.entries(activeFilters).map(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return null;

      const displayValue = Array.isArray(value)
        ? value.join(", ")
        : String(value);
      const filterKeyTyped = key as keyof SearchFilters;

      if (Array.isArray(value)) {
        return value.map((v_item) => (
          <span
            key={`${key}-${v_item}`}
            className="bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-full text-xs flex items-center gap-1"
          >
            {key}: {v_item}
            <button
              onClick={() => onRemoveFilter(filterKeyTyped, v_item)}
              className="text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100"
            >
              <X size={12} />
            </button>
          </span>
        ));
      } else {
        return (
          <span
            key={key}
            className="bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-full text-xs flex items-center gap-1"
          >
            {key}: {displayValue}
            <button
              onClick={() => onRemoveFilter(filterKeyTyped)}
              className="text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100"
            >
              <X size={12} />
            </button>
          </span>
        );
      }
    })}
  </div>
);

const SearchControlsToolbar = ({
  totalResults,
  searchDuration,
  currentSort,
  onSortChange,
  currentLayout,
  onLayoutChange,
  onClearAllFilters,
  onToggleFilterSheet,
  viewType,
}: {
  totalResults: number;
  searchDuration?: string;
  currentSort: string;
  onSortChange: (sort: string) => void;
  currentLayout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  onClearAllFilters: () => void;
  onToggleFilterSheet: () => void;
  viewType: "landing" | "results";
}) => {
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "downloads", label: "Most Downloaded" },
    { value: "name", label: "Name (A-Z)" },
  ];

  return (
    <div className="p-4 my-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3 shadow">
      {viewType === "results" && (
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {totalResults} results {searchDuration && `(${searchDuration})`}
        </p>
      )}
      {viewType === "landing" && <div className="flex-grow sm:flex-grow-0" />}

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger
            className="w-auto min-w-[150px] h-9 text-sm focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Sort results by"
          >
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilterSheet}
          className="h-9 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <SlidersHorizontal size={16} className="mr-2" />
          Filters
        </Button>

        {viewType === "results" && (
          <>
            <div className="flex items-center gap-1">
              <Button
                variant={currentLayout === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onLayoutChange("grid")}
                aria-label="Switch to grid view"
                className="h-9 w-9"
              >
                <LayoutGrid size={18} />
              </Button>
              <Button
                variant={currentLayout === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onLayoutChange("list")}
                aria-label="Switch to list view"
                className="h-9 w-9"
              >
                <List size={18} />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="h-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear All
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Real API call function to replace the mock
const fetchDatasets = async (
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  filters?: SearchFilters
): Promise<{ datasets: Dataset[]; total: number; hasMore: boolean }> => {
  const searchFilters: SearchFilters = {
    search_term: search,
    sort_by: sortBy as "newest" | "oldest" | "downloads" | "name",
    page,
    limit,
    ...filters,
  };

  return await searchDatasets(searchFilters);
};

export default function SearchDatasetsPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { ref: loadMoreRef, inView } = useInView();

  const [viewMode, setViewMode] = useState<"landing" | "results">("landing");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({});
  const [currentSort, setCurrentSort] = useState("newest");
  const [currentLayout, setCurrentLayout] = useState<"grid" | "list">("grid");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Calculate date filters for meaningful sections
  const getFirstDayOfMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  const getSevenDaysAgo = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return sevenDaysAgo.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  // Fetch data for landing page carousels
  const { data: mostDownloadedData, isLoading: isLoadingMostDownloaded } =
    useQuery({
      queryKey: ["datasets", "most-downloaded"],
      queryFn: () => searchDatasets({ sort_by: "downloads", limit: 4 }),
      enabled: !isAuthLoading,
    });

  const { data: recentlyAddedData, isLoading: isLoadingRecentlyAdded } =
    useQuery({
      queryKey: ["datasets", "recently-added"],
      queryFn: () => searchDatasets({ sort_by: "newest", limit: 4 }),
      enabled: !isAuthLoading,
    });

  const { data: thisMonthData, isLoading: isLoadingThisMonth } = useQuery({
    queryKey: ["datasets", "this-month"],
    queryFn: () =>
      searchDatasets({
        date_from: getFirstDayOfMonth(),
        sort_by: "newest",
        limit: 4,
      }),
    enabled: !isAuthLoading,
  });

  const { data: popularThisWeekData, isLoading: isLoadingPopularThisWeek } =
    useQuery({
      queryKey: ["datasets", "popular-this-week"],
      queryFn: () =>
        searchDatasets({
          date_from: getSevenDaysAgo(),
          sort_by: "downloads",
          limit: 4,
        }),
      enabled: !isAuthLoading,
    });

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["allDatasets", activeSearchQuery, currentSort, appliedFilters],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        return await fetchDatasets(
          pageParam,
          12,
          activeSearchQuery,
          currentSort,
          appliedFilters
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
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !isAuthLoading && viewMode === "results",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSearchSubmit = useCallback((query: string) => {
    setActiveSearchQuery(query);
    setViewMode("results");
  }, []);

  const handleCarouselSeeAll = useCallback((category: string) => {
    setViewMode("results");
    setActiveSearchQuery("");
    switch (category) {
      case "Most Downloaded":
        setCurrentSort("downloads");
        setAppliedFilters({});
        break;
      case "Recently Added":
        setCurrentSort("newest");
        setAppliedFilters({});
        break;
      case "This Month's Uploads":
        setAppliedFilters({ date_from: getFirstDayOfMonth() });
        setCurrentSort("newest");
        break;
      case "Popular This Week":
        setAppliedFilters({ date_from: getSevenDaysAgo() });
        setCurrentSort("downloads");
        break;
      default:
        setCurrentSort("newest");
        setAppliedFilters({});
    }
  }, []);

  const handleFilterChange = useCallback(
    (
      filterKey: keyof SearchFilters,
      value: SearchFilters[keyof SearchFilters]
    ) => {
      setAppliedFilters((prev) => {
        const newFilters = { ...prev };

        if (filterKey === "date_from" || filterKey === "date_to") {
          if (typeof value === "string" && value) {
            newFilters[filterKey] = value;
          } else {
            delete newFilters[filterKey];
          }
        } else if (filterKey === "search_term") {
          if (typeof value === "string" && value) {
            newFilters[filterKey] = value;
          } else {
            delete newFilters[filterKey];
          }
        } else if (filterKey === "uploader_id") {
          if (typeof value === "number") {
            newFilters[filterKey] = value;
          } else {
            delete newFilters[filterKey];
          }
        } else if (filterKey === "tags" || filterKey === "file_types") {
          if (
            Array.isArray(value) &&
            value.every((v) => typeof v === "string")
          ) {
            if (value.length > 0) {
              newFilters[filterKey] = value as string[];
            } else {
              delete newFilters[filterKey];
            }
          } else if (typeof value === "string" && value) {
            newFilters[filterKey] = [value] as string[];
          } else {
            delete newFilters[filterKey];
          }
        } else if (filterKey === "sort_by") {
          if (
            typeof value === "string" &&
            ["newest", "oldest", "downloads", "name"].includes(value)
          ) {
            newFilters[filterKey] = value as
              | "newest"
              | "oldest"
              | "downloads"
              | "name";
          } else {
            delete newFilters[filterKey];
          }
        } else if (filterKey === "has_location") {
          if (typeof value === "boolean") {
            newFilters[filterKey] = value;
          } else {
            delete newFilters[filterKey];
          }
        } else if (
          filterKey === "min_downloads" ||
          filterKey === "max_downloads"
        ) {
          if (typeof value === "number" && value >= 0) {
            newFilters[filterKey] = value;
          } else if (value === undefined) {
            delete newFilters[filterKey];
          }
        }
        return newFilters;
      });
      if (viewMode === "landing") setViewMode("results");
    },
    [viewMode]
  );

  const handleRemoveFilterChip = useCallback(
    (filterKey: keyof SearchFilters, valueToRemove?: string) => {
      setAppliedFilters((prev) => {
        const newFilters = { ...prev };
        const currentFilterValue = newFilters[filterKey];

        if (valueToRemove && Array.isArray(currentFilterValue)) {
          const updatedArray = (currentFilterValue as string[]).filter(
            (v) => v !== valueToRemove
          );

          if (updatedArray.length === 0) {
            delete newFilters[filterKey];
          } else {
            if (filterKey === "tags" || filterKey === "file_types") {
              newFilters[filterKey] = updatedArray;
            }
          }
        } else {
          delete newFilters[filterKey];
        }
        return newFilters;
      });
    },
    []
  );

  const resetAllFiltersAndSearch = useCallback(() => {
    setActiveSearchQuery("");
    setAppliedFilters({});
    setCurrentSort("newest");
    refetch();
  }, [refetch]);

  const datasets = data?.pages.flatMap((page) => page.datasets) || [];
  const totalResults = data?.pages[0]?.total || 0;
  const searchDuration =
    viewMode === "results" && !isLoading && activeSearchQuery
      ? `${(Math.random() * 0.3 + 0.05).toFixed(2)}s`
      : undefined;

  if (isAuthLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background z-40">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 relative min-h-[80vh]">
      {viewMode === "landing" && (
        <>
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-800 dark:text-white">
              Discover Datasets
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Explore a universe of data. Start your search or browse
              categories.
            </p>
          </div>
          <EnhancedSearchBarPlaceholder onSearch={handleSearchSubmit} />

          <SearchControlsToolbar
            totalResults={0}
            currentSort={currentSort}
            onSortChange={(sort) => {
              setCurrentSort(sort);
              setViewMode("results");
            }}
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
            onClearAllFilters={resetAllFiltersAndSearch}
            onToggleFilterSheet={() => setIsFilterSheetOpen(true)}
            viewType="landing"
          />

          <DatasetCarouselSectionPlaceholder
            title="Most Downloaded"
            onSeeAll={() => handleCarouselSeeAll("Most Downloaded")}
            datasets={mostDownloadedData?.datasets || []}
            isLoading={isLoadingMostDownloaded}
          />
          <DatasetCarouselSectionPlaceholder
            title="Recently Added"
            onSeeAll={() => handleCarouselSeeAll("Recently Added")}
            datasets={recentlyAddedData?.datasets || []}
            isLoading={isLoadingRecentlyAdded}
          />
          <DatasetCarouselSectionPlaceholder
            title="This Month's Uploads"
            onSeeAll={() => handleCarouselSeeAll("This Month's Uploads")}
            datasets={thisMonthData?.datasets || []}
            isLoading={isLoadingThisMonth}
          />
          <DatasetCarouselSectionPlaceholder
            title="Popular This Week"
            onSeeAll={() => handleCarouselSeeAll("Popular This Week")}
            datasets={popularThisWeekData?.datasets || []}
            isLoading={isLoadingPopularThisWeek}
          />
        </>
      )}

      {viewMode === "results" && (
        <>
          <EnhancedSearchBarPlaceholder
            onSearch={handleSearchSubmit}
            initialQuery={activeSearchQuery}
          />

          <SearchControlsToolbar
            totalResults={totalResults}
            searchDuration={searchDuration}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
            onClearAllFilters={resetAllFiltersAndSearch}
            onToggleFilterSheet={() => setIsFilterSheetOpen(true)}
            viewType="results"
          />

          <div className="flex flex-col lg:flex-row gap-x-6 gap-y-8">
            <main className="flex-1 min-w-0">
              <FilterChipsDisplayPlaceholder
                activeFilters={appliedFilters}
                onRemoveFilter={handleRemoveFilterChip}
              />
              <Separator className="mb-6" />

              {isLoading && !datasets.length && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-40">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                      Searching datasets...
                    </p>
                  </div>
                </div>
              )}
              {isError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md mb-6">
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
              {!isLoading && !isError && datasets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                    No datasets match your search criteria.
                  </p>
                  <Button variant="outline" onClick={resetAllFiltersAndSearch}>
                    Clear all filters and search
                  </Button>
                </div>
              )}

              {datasets.length > 0 && (
                <div
                  className={`grid gap-4 ${currentLayout === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}
                >
                  {datasets.map((dataset) => (
                    <div key={dataset.dataset_id} className="group relative">
                      <DatasetCard
                        dataset={dataset}
                        isSelected={false}
                        onSelect={() => {}}
                        showSelectionCheckbox={false}
                      />
                    </div>
                  ))}
                </div>
              )}

              {isFetchingNextPage && (
                <div className="flex justify-center mt-8">
                  <LoadingSpinner />
                </div>
              )}
              {hasNextPage && !isFetchingNextPage && (
                <div ref={loadMoreRef} className="h-10 w-full" />
              )}
            </main>
          </div>
        </>
      )}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0">
          <VisuallyHidden asChild>
            <SheetTitle>Dataset Filters</SheetTitle>
          </VisuallyHidden>
          <VisuallyHidden asChild>
            <SheetDescription>
              Apply or change filters to refine the dataset search results.
            </SheetDescription>
          </VisuallyHidden>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Filters</h2>
              <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <X />
              </SheetClose>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar">
              <FilterPanelPlaceholder
                appliedFilters={appliedFilters}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="p-6 border-t">
              <Button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
