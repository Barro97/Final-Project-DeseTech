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
  Home,
  Users,
  Database,
} from "lucide-react";

import { useAuth } from "@/app/features/auth/context/AuthContext";
import { DatasetCard } from "@/app/features/dataset/components/DatasetCard";
import { UserCard } from "@/app/features/user/components/UserCard";
import { LoadingSpinner } from "@/app/components/atoms/loading-spinner";
import { Input } from "@/app/components/atoms/input";
import { Button } from "@/app/components/atoms/button";
import { Separator } from "@/app/components/atoms/separator";
import { useToast } from "@/app/features/toaster/hooks/useToast";
import { useUsedTags } from "@/app/features/tag/hooks/useTags";
import { useAvailableFileTypes } from "@/app/features/dataset/hooks/useAvailableFileTypes";
import { useSearchSuggestions } from "@/app/features/dataset/hooks/useSearchSuggestions";
import {
  Dataset,
  SearchFilters,
} from "@/app/features/dataset/types/datasetTypes";
import { searchDatasets } from "@/app/features/dataset/services/datasetService";
import {
  searchUsers,
  getUserSearchSuggestions,
} from "@/app/features/user/services/userSearchService";
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
  searchType,
  onSearchTypeChange,
}: {
  onSearch: (query: string) => void;
  initialQuery?: string;
  searchType: "datasets" | "users" | "all";
  onSearchTypeChange: (type: "datasets" | "users" | "all") => void;
}) => {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get dynamic suggestions from the database based on search type
  const {
    data: datasetSuggestions = [],
    isLoading: isLoadingDatasetSuggestions,
  } = useSearchSuggestions(
    inputValue,
    4, // limit to 4 dataset suggestions
    inputValue.length >= 2 &&
      (searchType === "datasets" || searchType === "all")
  );

  // Get user suggestions
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [isLoadingUserSuggestions, setIsLoadingUserSuggestions] =
    useState(false);

  useEffect(() => {
    if (
      inputValue.length >= 2 &&
      (searchType === "users" || searchType === "all")
    ) {
      setIsLoadingUserSuggestions(true);
      getUserSearchSuggestions(inputValue, 4)
        .then(setUserSuggestions)
        .catch(() => setUserSuggestions([]))
        .finally(() => setIsLoadingUserSuggestions(false));
    } else {
      setUserSuggestions([]);
    }
  }, [inputValue, searchType]);

  // Combine suggestions based on search type
  const suggestions =
    searchType === "datasets"
      ? datasetSuggestions
      : searchType === "users"
        ? userSuggestions
        : [...datasetSuggestions, ...userSuggestions];

  const isLoadingSuggestions =
    searchType === "datasets"
      ? isLoadingDatasetSuggestions
      : searchType === "users"
        ? isLoadingUserSuggestions
        : isLoadingDatasetSuggestions || isLoadingUserSuggestions;

  const handleSubmit = () => {
    onSearch(inputValue);
    setShowSuggestions(false);
  };

  const getPlaceholderText = () => {
    switch (searchType) {
      case "datasets":
        return "Search for datasets (e.g., Climate, Finance)...";
      case "users":
        return "Search for researchers (e.g., John Smith, University)...";
      case "all":
        return "Search for datasets and researchers...";
      default:
        return "Search...";
    }
  };

  return (
    <div className="p-4 my-4 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
      {/* Search Type Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search:
        </span>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => onSearchTypeChange("datasets")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              searchType === "datasets"
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Database className="h-4 w-4 inline mr-1" />
            Datasets
          </button>
          <button
            onClick={() => onSearchTypeChange("users")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              searchType === "users"
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Users className="h-4 w-4 inline mr-1" />
            Users
          </button>
          <button
            onClick={() => onSearchTypeChange("all")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              searchType === "all"
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder={getPlaceholderText()}
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
      {showSuggestions && inputValue && inputValue.length >= 2 && (
        <div className="relative">
          <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            {isLoadingSuggestions ? (
              <li className="px-4 py-2 text-gray-500">
                Loading suggestions...
              </li>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion}-${index}`}
                  onClick={() => {
                    setInputValue(suggestion);
                    onSearch(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                >
                  {suggestion}
                </li>
              ))
            ) : (
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
  pendingFilters,
  onPendingFilterChange,
}: {
  pendingFilters: SearchFilters;
  onPendingFilterChange: (
    filterKey: keyof SearchFilters,
    value: string | string[] | boolean | number | undefined
  ) => void;
}) => {
  // Fetch real tags from database (only used tags to avoid empty results)
  const { data: tagsData, isLoading: isLoadingTags } = useUsedTags();
  const availableTags = tagsData?.tags || [];

  // Fetch available file types from database
  const { data: availableFileTypes, isLoading: isLoadingFileTypes } =
    useAvailableFileTypes();
  const fileTypeOptions = availableFileTypes || [];

  // Approval status options (rejected datasets are automatically removed from database)
  const approvalStatusOptions = ["pending", "approved"];

  const handleCheckboxChange = (
    filterKey: "tags" | "file_types" | "approval_status",
    value: string,
    checked: boolean
  ) => {
    const currentFilterValues = pendingFilters[filterKey];
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
    onPendingFilterChange(filterKey, newValuesArray);
  };

  const handleDateChange = (
    filterKey: "date_from" | "date_to",
    value: string
  ) => {
    onPendingFilterChange(filterKey, value);
  };

  const handleNumberChange = (
    filterKey: "min_downloads" | "max_downloads",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    if (numValue !== undefined && !isNaN(numValue)) {
      onPendingFilterChange(filterKey, numValue);
    } else if (value === "") {
      onPendingFilterChange(filterKey, undefined);
    }
  };

  const handleLocationToggle = (checked: boolean) => {
    onPendingFilterChange("has_location", checked);
  };

  const handleTextChange = (
    filterKey: "geographic_location" | "data_time_period",
    value: string
  ) => {
    onPendingFilterChange(filterKey, value.trim() || undefined);
  };

  const renderFilterGroup = (
    title: string,
    filterKey: "tags" | "file_types" | "approval_status",
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
            const currentSelected = pendingFilters[filterKey];
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

      {renderFilterGroup(
        "File Types",
        "file_types",
        fileTypeOptions,
        isLoadingFileTypes
      )}

      {renderFilterGroup(
        "Approval Status",
        "approval_status",
        approvalStatusOptions
      )}

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Geographic Location
        </h3>
        <Input
          type="text"
          placeholder="e.g., Brazil, São Paulo, Farm XYZ"
          className="w-full"
          value={pendingFilters.geographic_location || ""}
          onChange={(e) =>
            handleTextChange("geographic_location", e.target.value)
          }
        />
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Data Time Period
        </h3>
        <Input
          type="text"
          placeholder="e.g., 2020-2023, Growing season 2022"
          className="w-full"
          value={pendingFilters.data_time_period || ""}
          onChange={(e) => handleTextChange("data_time_period", e.target.value)}
        />
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Geographic Data
        </h3>
        <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:checked:bg-blue-500"
            checked={pendingFilters.has_location || false}
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
            value={pendingFilters.min_downloads || ""}
            onChange={(e) =>
              handleNumberChange("min_downloads", e.target.value)
            }
          />
          <Input
            type="number"
            placeholder="Max downloads"
            className="w-full"
            min="0"
            value={pendingFilters.max_downloads || ""}
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
          value={pendingFilters.date_from || ""}
        />
        <Input
          type="date"
          placeholder="To"
          className="w-full"
          onChange={(e) => handleDateChange("date_to", e.target.value)}
          value={pendingFilters.date_to || ""}
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
  onReturnToLanding,
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
  onReturnToLanding?: () => void;
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
            <Button
              variant="outline"
              size="sm"
              onClick={onReturnToLanding}
              className="h-9 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <Home size={16} className="mr-2" />
              Back to Browse
            </Button>

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
  const [pendingFilters, setPendingFilters] = useState<SearchFilters>({});
  const [currentSort, setCurrentSort] = useState("newest");
  const [currentLayout, setCurrentLayout] = useState<"grid" | "list">("grid");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [searchType, setSearchType] = useState<"datasets" | "users" | "all">(
    "datasets"
  );

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

  // Sync pending filters with applied filters when filter sheet opens
  useEffect(() => {
    if (isFilterSheetOpen) {
      setPendingFilters(appliedFilters);
    }
  }, [isFilterSheetOpen, appliedFilters]);

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

  // Dataset search query
  const {
    data: datasetData,
    isLoading: isLoadingDatasets,
    isError: isDatasetError,
    fetchNextPage: fetchNextDatasetPage,
    hasNextPage: hasNextDatasetPage,
    isFetchingNextPage: isFetchingNextDatasetPage,
    refetch: refetchDatasets,
  } = useInfiniteQuery({
    queryKey: [
      "allDatasets",
      activeSearchQuery,
      currentSort,
      appliedFilters,
      searchType,
    ],
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
    enabled:
      !isAuthLoading &&
      viewMode === "results" &&
      (searchType === "datasets" || searchType === "all"),
  });

  // User search query
  const {
    data: userData,
    isLoading: isLoadingUsers,
    isError: isUserError,
    fetchNextPage: fetchNextUserPage,
    hasNextPage: hasNextUserPage,
    isFetchingNextPage: isFetchingNextUserPage,
    refetch: refetchUsers,
  } = useInfiniteQuery({
    queryKey: [
      "allUsers",
      activeSearchQuery,
      currentSort,
      appliedFilters,
      searchType,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        return await searchUsers({
          search_term: activeSearchQuery,
          sort_by:
            currentSort === "newest"
              ? "recent"
              : currentSort === "downloads"
                ? "datasets"
                : currentSort,
          page: pageParam,
          limit: 12,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to fetch users. Please try again.",
          variant: "error",
        });
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_next ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled:
      !isAuthLoading &&
      viewMode === "results" &&
      (searchType === "users" || searchType === "all"),
  });

  useEffect(() => {
    // Handle dataset infinite scroll
    if (
      inView &&
      hasNextDatasetPage &&
      !isFetchingNextDatasetPage &&
      (searchType === "datasets" || searchType === "all")
    ) {
      fetchNextDatasetPage();
    }
    // Handle user infinite scroll
    if (
      inView &&
      hasNextUserPage &&
      !isFetchingNextUserPage &&
      (searchType === "users" || searchType === "all")
    ) {
      fetchNextUserPage();
    }
  }, [
    inView,
    fetchNextDatasetPage,
    hasNextDatasetPage,
    isFetchingNextDatasetPage,
    fetchNextUserPage,
    hasNextUserPage,
    isFetchingNextUserPage,
    searchType,
  ]);

  const handleSearchSubmit = useCallback((query: string) => {
    setActiveSearchQuery(query);
    setViewMode("results");
  }, []);

  const handleCarouselSeeAll = useCallback((category: string) => {
    setViewMode("results");
    setActiveSearchQuery("");
    setSearchType("datasets"); // Always show datasets for carousel "see all"
    switch (category) {
      case "Most Downloaded":
        setCurrentSort("downloads");
        setAppliedFilters({});
        setPendingFilters({});
        break;
      case "Recently Added":
        setCurrentSort("newest");
        setAppliedFilters({});
        setPendingFilters({});
        break;
      case "This Month's Uploads":
        const thisMonthFilters = { date_from: getFirstDayOfMonth() };
        setAppliedFilters(thisMonthFilters);
        setPendingFilters(thisMonthFilters);
        setCurrentSort("newest");
        break;
      case "Popular This Week":
        const thisWeekFilters = { date_from: getSevenDaysAgo() };
        setAppliedFilters(thisWeekFilters);
        setPendingFilters(thisWeekFilters);
        setCurrentSort("downloads");
        break;
      default:
        setCurrentSort("newest");
        setAppliedFilters({});
        setPendingFilters({});
    }
  }, []);

  const handlePendingFilterChange = useCallback(
    (
      filterKey: keyof SearchFilters,
      value: SearchFilters[keyof SearchFilters]
    ) => {
      setPendingFilters((prev) => {
        const newFilters = { ...prev };

        if (filterKey === "date_from" || filterKey === "date_to") {
          if (typeof value === "string" && value) {
            newFilters[filterKey] = value;
          } else {
            delete newFilters[filterKey];
          }
        } else if (
          filterKey === "search_term" ||
          filterKey === "geographic_location" ||
          filterKey === "data_time_period"
        ) {
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
        } else if (
          filterKey === "tags" ||
          filterKey === "file_types" ||
          filterKey === "approval_status"
        ) {
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
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    console.log("🔧 Applying filters:", pendingFilters);
    setAppliedFilters(pendingFilters);
    setIsFilterSheetOpen(false);
    if (viewMode === "landing") setViewMode("results");
  }, [pendingFilters, viewMode]);

  const handleToggleFilterSheet = useCallback(() => {
    console.log("🔧 Toggling filter sheet. Current state:", isFilterSheetOpen);
    setIsFilterSheetOpen(!isFilterSheetOpen);
  }, [isFilterSheetOpen]);

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
    setPendingFilters({});
    setCurrentSort("newest");
    // Refetch both datasets and users
    refetchDatasets();
    refetchUsers();
  }, [refetchDatasets, refetchUsers]);

  const returnToLandingPage = useCallback(() => {
    setViewMode("landing");
    setActiveSearchQuery("");
    setAppliedFilters({});
    setPendingFilters({});
    setCurrentSort("newest");
  }, []);

  // Combine data based on search type
  const datasets = datasetData?.pages.flatMap((page) => page.datasets) || [];
  const users = userData?.pages.flatMap((page) => page.users) || [];

  // Calculate totals and loading states based on search type
  const getTotalResults = () => {
    if (searchType === "datasets") return datasetData?.pages[0]?.total || 0;
    if (searchType === "users") return userData?.pages[0]?.total_count || 0;
    if (searchType === "all")
      return (
        (datasetData?.pages[0]?.total || 0) +
        (userData?.pages[0]?.total_count || 0)
      );
    return 0;
  };

  const getIsLoading = () => {
    if (searchType === "datasets") return isLoadingDatasets;
    if (searchType === "users") return isLoadingUsers;
    if (searchType === "all") return isLoadingDatasets || isLoadingUsers;
    return false;
  };

  const getIsError = () => {
    if (searchType === "datasets") return isDatasetError;
    if (searchType === "users") return isUserError;
    if (searchType === "all") return isDatasetError || isUserError;
    return false;
  };

  const getIsFetchingNextPage = () => {
    if (searchType === "datasets") return isFetchingNextDatasetPage;
    if (searchType === "users") return isFetchingNextUserPage;
    if (searchType === "all")
      return isFetchingNextDatasetPage || isFetchingNextUserPage;
    return false;
  };

  const getHasNextPage = () => {
    if (searchType === "datasets") return hasNextDatasetPage;
    if (searchType === "users") return hasNextUserPage;
    if (searchType === "all") return hasNextDatasetPage || hasNextUserPage;
    return false;
  };

  const totalResults = getTotalResults();
  const isLoading = getIsLoading();
  const isError = getIsError();
  const isFetchingNextPage = getIsFetchingNextPage();
  const hasNextPage = getHasNextPage();

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
              {searchType === "users"
                ? "Discover Researchers"
                : searchType === "all"
                  ? "Discover Datasets & Researchers"
                  : "Discover Datasets"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {searchType === "users"
                ? "Connect with researchers and explore their work."
                : searchType === "all"
                  ? "Explore datasets and connect with researchers."
                  : "Explore a universe of data. Start your search or browse categories."}
            </p>
          </div>
          <EnhancedSearchBarPlaceholder
            onSearch={handleSearchSubmit}
            initialQuery={activeSearchQuery}
            searchType={searchType}
            onSearchTypeChange={setSearchType}
          />

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
            onToggleFilterSheet={handleToggleFilterSheet}
            onReturnToLanding={returnToLandingPage}
            viewType="landing"
          />

          {/* Only show dataset carousels when search type includes datasets */}
          {(searchType === "datasets" || searchType === "all") && (
            <>
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

          {/* Show message for users-only search */}
          {searchType === "users" && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Search for Researchers
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                Use the search bar above to find researchers by name,
                organization, or expertise area.
              </p>
            </div>
          )}
        </>
      )}

      {viewMode === "results" && (
        <>
          <EnhancedSearchBarPlaceholder
            onSearch={handleSearchSubmit}
            initialQuery={activeSearchQuery}
            searchType={searchType}
            onSearchTypeChange={setSearchType}
          />

          <SearchControlsToolbar
            totalResults={totalResults}
            searchDuration={searchDuration}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
            onClearAllFilters={resetAllFiltersAndSearch}
            onToggleFilterSheet={handleToggleFilterSheet}
            onReturnToLanding={returnToLandingPage}
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
                  <p>
                    Failed to load{" "}
                    {searchType === "datasets"
                      ? "datasets"
                      : searchType === "users"
                        ? "users"
                        : "results"}
                    . Please try again later.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (searchType === "datasets") refetchDatasets();
                      else if (searchType === "users") refetchUsers();
                      else {
                        refetchDatasets();
                        refetchUsers();
                      }
                    }}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              )}
              {!isLoading && !isError && totalResults === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                    No{" "}
                    {searchType === "datasets"
                      ? "datasets"
                      : searchType === "users"
                        ? "users"
                        : "results"}{" "}
                    match your search criteria.
                  </p>
                  <Button variant="outline" onClick={resetAllFiltersAndSearch}>
                    Clear all filters and search
                  </Button>
                </div>
              )}

              {/* Results Display */}
              {(datasets.length > 0 || users.length > 0) && (
                <div className="space-y-8">
                  {/* Dataset Results */}
                  {(searchType === "datasets" || searchType === "all") &&
                    datasets.length > 0 && (
                      <div>
                        {searchType === "all" && (
                          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                            Datasets ({datasets.length})
                          </h3>
                        )}
                        <div
                          className={`grid gap-4 items-stretch ${
                            currentLayout === "grid"
                              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                              : "grid-cols-1"
                          }`}
                        >
                          {datasets.map((dataset) => (
                            <div
                              key={dataset.dataset_id}
                              className="group relative h-full"
                            >
                              <DatasetCard
                                dataset={dataset}
                                isSelected={false}
                                onSelect={() => {}}
                                showSelectionCheckbox={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* User Results */}
                  {(searchType === "users" || searchType === "all") &&
                    users.length > 0 && (
                      <div>
                        {searchType === "all" && (
                          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                            Researchers ({users.length})
                          </h3>
                        )}
                        <div className="grid gap-4 grid-cols-1">
                          {users.map((user) => (
                            <div key={user.user_id} className="group relative">
                              <UserCard
                                user={user}
                                showSelectionCheckbox={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
        <SheetContent
          side="left"
          className="w-full sm:max-w-md p-0 flex flex-col !bg-background !bg-opacity-100"
          showDefaultClose={false}
          style={{
            opacity: 1,
            backgroundColor: "var(--background)",
            backdropFilter: "none",
          }}
        >
          <VisuallyHidden asChild>
            <SheetTitle>Dataset Filters</SheetTitle>
          </VisuallyHidden>
          <VisuallyHidden asChild>
            <SheetDescription>
              Apply or change filters to refine the dataset search results.
            </SheetDescription>
          </VisuallyHidden>
          {/* Header */}
          <div
            className="p-6 border-b flex justify-between items-center flex-shrink-0 !bg-opacity-100"
            style={{
              backgroundColor: "var(--background)",
              backdropFilter: "none",
            }}
          >
            <h2 className="text-lg font-semibold">Filters</h2>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X />
            </SheetClose>
          </div>

          {/* Scrollable Filter Content */}
          <div
            className="flex-1 overflow-y-auto custom-scrollbar min-h-0 !bg-opacity-100"
            style={{
              backgroundColor: "var(--background)",
              backdropFilter: "none",
            }}
          >
            <FilterPanelPlaceholder
              pendingFilters={pendingFilters}
              onPendingFilterChange={handlePendingFilterChange}
            />
          </div>

          {/* Fixed Apply Button */}
          <div
            className="p-6 border-t bg-background flex-shrink-0 shadow-lg !bg-opacity-100"
            style={{
              backgroundColor: "var(--background)",
              backdropFilter: "none",
            }}
          >
            <Button
              onClick={handleApplyFilters}
              className="w-full h-12 text-base font-semibold text-white filter-apply-button"
              style={{
                backgroundColor: "var(--primary)",
                opacity: 1,
                backdropFilter: "none",
              }}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
