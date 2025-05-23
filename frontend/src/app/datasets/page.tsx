"use client";
import { useEffect, useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import { Dataset } from "@/app/features/dataset/types/datasetTypes";
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

interface SearchFilters {
  date_from?: string;
  date_to?: string;
  license?: string | string[];
  tags?: string[];
  size_range?: Array<"small" | "medium" | "large">;
  file_type?: string[];
  custom_field_contains?: string;
  row_count_min?: number;
}

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
}: {
  title: string;
  onSeeAll: () => void;
  datasets: Dataset[];
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
  </div>
);

const FilterPanelPlaceholder = ({
  appliedFilters,
  onFilterChange,
  onAdvancedFilterToggle,
}: {
  appliedFilters: SearchFilters;
  onFilterChange: (
    filterKey: keyof SearchFilters,
    value: string | string[]
  ) => void;
  onAdvancedFilterToggle: () => void;
}) => {
  const filterOptions = {
    file_type: ["CSV", "JSON", "Parquet", "XML", "TXT"],
    tags: [
      "Health",
      "AI",
      "Agriculture",
      "Finance",
      "Climate",
      "Education",
      "Energy",
    ],
    license: [
      "CC BY 4.0",
      "MIT",
      "Public Domain",
      "Open Data Commons",
      "Proprietary",
    ],
    size_range: ["small", "medium", "large"],
    updated_date: ["last_week", "last_month", "last_year"],
  };

  const handleCheckboxChange = (
    filterKey: Extract<
      keyof SearchFilters,
      "file_type" | "tags" | "license" | "size_range"
    >,
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

  const handleDateChange = (filterKey: keyof SearchFilters, value: string) => {
    onFilterChange(filterKey, value);
  };

  const renderFilterGroup = (
    title: string,
    filterKey: Extract<
      keyof SearchFilters,
      "file_type" | "tags" | "license" | "size_range"
    >,
    options: ReadonlyArray<string>
  ) => (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {options.map((option) => {
          const currentSelected = appliedFilters[filterKey];
          let isChecked = false;
          if (Array.isArray(currentSelected)) {
            if (filterKey === "size_range") {
              isChecked = (
                currentSelected as Array<"small" | "medium" | "large">
              ).includes(option as "small" | "medium" | "large");
            } else {
              isChecked = (currentSelected as string[]).includes(option);
            }
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
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
      {renderFilterGroup("File Type", "file_type", filterOptions.file_type)}
      {renderFilterGroup("Tags", "tags", filterOptions.tags)}
      {renderFilterGroup("License", "license", filterOptions.license)}
      {renderFilterGroup("Size Range", "size_range", filterOptions.size_range)}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Updated Date
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
      <Button
        variant="outline"
        onClick={onAdvancedFilterToggle}
        className="w-full mt-4 flex items-center justify-center gap-2"
      >
        <SlidersHorizontal size={16} /> Show Advanced Filters
      </Button>
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
    valueToRemove?: string | "small" | "medium" | "large"
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
    { value: "relevance", label: "Relevance" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "downloads", label: "Most Downloaded" },
    { value: "name_asc", label: "Name (A-Z)" },
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

const AdvancedFiltersDrawerPlaceholder = ({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    advFilters: Pick<SearchFilters, "custom_field_contains" | "row_count_min">
  ) => void;
}) => {
  const [customField, setCustomField] = useState("");
  const [rowCount, setRowCount] = useState<number | string>("");

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/30 z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-800 h-full p-6 shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Advanced Filters</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        <p className="text-sm text-gray-500">(Mock UI for advanced filters)</p>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Field Must Contain:
          </label>
          <Input
            type="text"
            placeholder="e.g., specific keyword"
            value={customField}
            onChange={(e) => setCustomField(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Row Count (min):
          </label>
          <Input
            type="number"
            placeholder="e.g., 1000"
            value={String(rowCount)}
            onChange={(e) =>
              setRowCount(e.target.value ? parseInt(e.target.value) : "")
            }
          />
        </div>
        <Button
          className="mt-6 w-full"
          onClick={() => {
            onApply({
              custom_field_contains: customField || undefined,
              row_count_min:
                typeof rowCount === "number" ? rowCount : undefined,
            });
            onClose();
          }}
        >
          Apply Advanced Filters
        </Button>
      </div>
    </div>
  );
};

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
    thumbnailUrl: "/placeholders/climate-data-thumb.png",
    size: "150 MB",
    license: "CC BY 4.0",
    tags: ["Climate", "Environment", "Temperature"],
    file_types: ["CSV", "TXT"],
    row_count: 150000,
  },
  {
    dataset_id: 2,
    dataset_name: "COVID-19 Statistics",
    date_of_creation: "2022-03-10",
    dataset_description: "Worldwide COVID-19 cases, recoveries, and fatalities",
    downloads_count: 782,
    uploader_id: 2,
    owners: [2, 3],
    thumbnailUrl: "/placeholders/covid-stats-thumb.png",
    size: "50 MB",
    license: "Public Domain",
    tags: ["Health", "COVID-19", "Statistics"],
    file_types: ["JSON", "CSV"],
    row_count: 500000,
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
    thumbnailUrl: "/placeholders/stock-market-thumb.png",
    size: "320 MB",
    license: "Proprietary",
    tags: ["Finance", "Stocks", "Analysis"],
    file_types: ["Parquet", "CSV"],
    row_count: 1200000,
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
    thumbnailUrl: "/placeholders/population-thumb.png",
    size: "75 MB",
    license: "Open Data Commons",
    tags: ["Demographics", "Population", "Global"],
    file_types: ["XML"],
    row_count: 80000,
  },
  {
    dataset_id: 5,
    dataset_name: "Renewable Energy Projects",
    date_of_creation: "2023-05-22",
    dataset_description: "Data on solar, wind, and hydro projects worldwide",
    downloads_count: 156,
    uploader_id: 2,
    owners: [2],
    thumbnailUrl: "/placeholders/renewable-energy-thumb.png",
    size: "45 MB",
    license: "CC BY-SA 4.0",
    tags: ["Energy", "Renewable", "Projects"],
    file_types: ["JSON"],
    row_count: 10000,
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
    thumbnailUrl: "/placeholders/healthcare-spending-thumb.png",
    size: "120 MB",
    license: "CC BY-NC 4.0",
    tags: ["Health", "Economics", "Healthcare"],
    file_types: ["CSV", "JSON"],
    row_count: 250000,
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
    thumbnailUrl: "/placeholders/education-outcomes-thumb.png",
    size: "90 MB",
    license: "CC BY 4.0",
    tags: ["Education", "Research", "Social Science"],
    file_types: ["CSV"],
    row_count: 100000,
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
    thumbnailUrl: "/placeholders/urban-transport-thumb.png",
    size: "200 MB",
    license: "Open Data Commons",
    tags: ["Transportation", "Urban", "Smart City"],
    file_types: ["CSV"],
    row_count: 100000,
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
    thumbnailUrl: "/placeholders/ecommerce-thumb.png",
    size: "65 MB",
    license: "Proprietary",
    tags: ["Business", "E-commerce", "Consumer Behavior"],
    file_types: ["CSV"],
    row_count: 50000,
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
    thumbnailUrl: "/placeholders/satellite-imagery-thumb.png",
    size: "1.2 GB",
    license: "CC BY-NC-ND 4.0",
    tags: ["Environment", "Remote Sensing", "Geography"],
    row_count: 5000,
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
    thumbnailUrl: "/placeholders/social-media-thumb.png",
    size: "30 MB",
    license: "CC BY 4.0",
    tags: ["Social Media", "Analytics", "Digital Trends"],
    file_types: ["CSV"],
    row_count: 20000,
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
    thumbnailUrl: "/placeholders/agri-yield-thumb.png",
    size: "180 MB",
    license: "Open Data Commons",
    tags: ["Agriculture", "Food Security", "Farming"],
    file_types: ["CSV", "Parquet"],
    row_count: 300000,
  },
  {
    dataset_id: 13,
    dataset_name: "Ocean Temperature Readings",
    date_of_creation: "2023-06-08",
    dataset_description: "Oceanic temperature measurements from buoy networks",
    downloads_count: 189,
    uploader_id: 1,
    owners: [1],
    thumbnailUrl: "/placeholders/ocean-temp-thumb.png",
    size: "95 MB",
    license: "CC BY 4.0",
    tags: ["Oceanography", "Climate", "Marine Science"],
    file_types: ["CSV"],
    row_count: 50000,
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
    thumbnailUrl: "/placeholders/mental-health-thumb.png",
    size: "40 MB",
    license: "Public Domain",
    tags: ["Health", "Psychology", "Well-being"],
    file_types: ["CSV"],
    row_count: 20000,
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
    thumbnailUrl: "/placeholders/renewable-adoption-thumb.png",
    size: "60 MB",
    license: "CC BY-SA 4.0",
    tags: ["Energy", "Sustainability", "Economics"],
    file_types: ["CSV"],
    row_count: 100000,
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
    thumbnailUrl: "/placeholders/housing-market-thumb.png",
    size: "250 MB",
    license: "Proprietary",
    tags: ["Real Estate", "Finance", "Urban Development"],
    file_types: ["CSV"],
    row_count: 1000000,
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
    thumbnailUrl: "/placeholders/air-quality-thumb.png",
    size: "110 MB",
    license: "CC BY-NC 4.0",
    tags: ["Environment", "Public Health", "Pollution"],
    file_types: ["CSV"],
    row_count: 50000,
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
    thumbnailUrl: "/placeholders/cybersecurity-thumb.png",
    size: "25 MB",
    license: "Open Data Commons",
    tags: ["Security", "Technology", "Cybercrime"],
    file_types: ["JSON", "TXT"],
    row_count: 15000,
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
    thumbnailUrl: "/placeholders/remote-work-thumb.png",
    size: "35 MB",
    license: "CC BY 4.0",
    tags: ["Work", "Productivity", "Future of Work"],
    file_types: ["CSV"],
    row_count: 20000,
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
    thumbnailUrl: "/placeholders/biodiversity-thumb.png",
    size: "300 MB",
    license: "CC BY-NC-SA 4.0",
    tags: ["Biology", "Ecology", "Conservation"],
    file_types: ["CSV"],
    row_count: 1000000,
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
    thumbnailUrl: "/placeholders/vaccine-efficacy-thumb.png",
    size: "80 MB",
    license: "Public Domain",
    tags: ["Health", "Medicine", "Vaccines"],
    file_types: ["CSV"],
    row_count: 50000,
  },
  {
    dataset_id: 22,
    dataset_name: "Consumer Price Index Data",
    date_of_creation: "2022-10-24",
    dataset_description: "Historical CPI data with regional comparisons",
    downloads_count: 345,
    uploader_id: 3,
    owners: [3],
    thumbnailUrl: "/placeholders/cpi-data-thumb.png",
    size: "130 MB",
    license: "Open Data Commons",
    tags: ["Economics", "Finance", "Inflation"],
    file_types: ["CSV"],
    row_count: 100000,
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
    thumbnailUrl: "/placeholders/digital-literacy-thumb.png",
    size: "20 MB",
    license: "CC BY 4.0",
    tags: ["Education", "Technology", "Social Equity"],
    file_types: ["CSV"],
    row_count: 20000,
  },
  {
    dataset_id: 24,
    dataset_name: "Renewable Water Resources",
    date_of_creation: "2022-08-17",
    dataset_description: "Freshwater availability and usage patterns globally",
    downloads_count: 183,
    uploader_id: 4,
    owners: [4],
    thumbnailUrl: "/placeholders/water-resources-thumb.png",
    size: "220 MB",
    license: "CC BY-NC 4.0",
    tags: ["Environment", "Water", "Sustainability"],
    file_types: ["CSV"],
    row_count: 1000000,
  },
];

const simulateDatasetFetch = (
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  filters?: SearchFilters
): Promise<{ datasets: Dataset[]; total: number; hasMore: boolean }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredData = [...DUMMY_DATASETS];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter(
          (dataset) =>
            dataset.dataset_name.toLowerCase().includes(searchLower) ||
            (dataset.dataset_description &&
              dataset.dataset_description.toLowerCase().includes(searchLower))
        );
      }

      if (filters) {
        if (filters.date_from) {
          const dateFrom = new Date(filters.date_from);
          if (!isNaN(dateFrom.getTime())) {
            filteredData = filteredData.filter(
              (dataset) => new Date(dataset.date_of_creation) >= dateFrom
            );
          }
        }
        if (filters.date_to) {
          const dateTo = new Date(filters.date_to);
          if (!isNaN(dateTo.getTime())) {
            filteredData = filteredData.filter(
              (dataset) => new Date(dataset.date_of_creation) <= dateTo
            );
          }
        }
        if (filters.license && filters.license.length > 0) {
          const licenseFilters = Array.isArray(filters.license)
            ? filters.license.map((l) => l.toLowerCase())
            : [filters.license.toLowerCase()];
          filteredData = filteredData.filter(
            (dataset) =>
              dataset.license &&
              licenseFilters.includes(dataset.license.toLowerCase())
          );
        }
        if (filters.tags && filters.tags.length > 0) {
          filteredData = filteredData.filter((dataset) =>
            dataset.tags?.some((tag) =>
              filters
                .tags!.map((t) => t.toLowerCase())
                .includes(tag.toLowerCase())
            )
          );
        }
        if (filters.size_range && filters.size_range.length > 0) {
          filteredData = filteredData.filter((dataset) => {
            if (!dataset.size) return false;
            const sizeParts = dataset.size.toLowerCase().split(" ");
            if (sizeParts.length !== 2) return false;
            const value = parseFloat(sizeParts[0]);
            const unit = sizeParts[1];
            let sizeInMB = value;
            if (unit === "gb") sizeInMB = value * 1024;
            else if (unit === "kb") sizeInMB = value / 1024;

            return filters.size_range!.some((range) => {
              switch (range) {
                case "small":
                  return sizeInMB < 100;
                case "medium":
                  return sizeInMB >= 100 && sizeInMB <= 500;
                case "large":
                  return sizeInMB > 500;
                default:
                  return false;
              }
            });
          });
        }
        if (filters.file_type && filters.file_type.length > 0) {
          const fileTypeFiltersLower = filters.file_type.map((ft) =>
            ft.toLowerCase()
          );
          filteredData = filteredData.filter((dataset) =>
            dataset.file_types?.some((ft) =>
              fileTypeFiltersLower.includes(ft.toLowerCase())
            )
          );
        }
        if (
          filters.custom_field_contains &&
          typeof filters.custom_field_contains === "string"
        ) {
          const customSearchLower = filters.custom_field_contains.toLowerCase();
          filteredData = filteredData.filter(
            (dataset) =>
              dataset.dataset_name.toLowerCase().includes(customSearchLower) ||
              (dataset.dataset_description &&
                dataset.dataset_description
                  .toLowerCase()
                  .includes(customSearchLower))
          );
        }
        if (
          filters.row_count_min &&
          typeof filters.row_count_min === "number"
        ) {
          filteredData = filteredData.filter(
            (dataset) =>
              dataset.row_count !== undefined &&
              dataset.row_count >= filters.row_count_min!
          );
        }
      }

      if (sortBy) {
        switch (sortBy) {
          case "newest":
          case "relevance":
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
        }
      }
      const total = filteredData.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      const hasMore = endIndex < filteredData.length;
      resolve({ datasets: paginatedData, total, hasMore });
    }, 300);
  });
};

export default function SearchDatasetsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { ref: loadMoreRef, inView } = useInView();

  const [viewMode, setViewMode] = useState<"landing" | "results">("landing");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>({});
  const [currentSort, setCurrentSort] = useState("relevance");
  const [currentLayout, setCurrentLayout] = useState<"grid" | "list">("grid");
  const [isAdvancedDrawerOpen, setIsAdvancedDrawerOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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
        return await simulateDatasetFetch(
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
    enabled: !isAuthLoading,
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
      case "Trending Tags":
        setAppliedFilters({ tags: ["AI", "Health"] });
        setCurrentSort("relevance");
        break;
      case "Recommended":
        setAppliedFilters({ tags: ["Climate"] });
        setCurrentSort("relevance");
        break;
      default:
        setCurrentSort("relevance");
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
        } else if (filterKey === "custom_field_contains") {
          if (typeof value === "string" && value) {
            newFilters[filterKey] = value;
          } else {
            delete newFilters[filterKey];
          }
        } else if (filterKey === "row_count_min") {
          if (typeof value === "number") {
            newFilters[filterKey] = value;
          } else {
            delete newFilters[filterKey];
          }
        } else if (
          filterKey === "tags" ||
          filterKey === "license" ||
          filterKey === "file_type"
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
        } else if (filterKey === "size_range") {
          if (
            Array.isArray(value) &&
            value.every((v) => ["small", "medium", "large"].includes(v))
          ) {
            if (value.length > 0) {
              newFilters[filterKey] = value as Array<
                "small" | "medium" | "large"
              >;
            } else {
              delete newFilters[filterKey];
            }
          } else if (
            typeof value === "string" &&
            ["small", "medium", "large"].includes(value)
          ) {
            newFilters[filterKey] = [value] as Array<
              "small" | "medium" | "large"
            >;
          } else {
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
    (
      filterKey: keyof SearchFilters,
      valueToRemove?: string | "small" | "medium" | "large"
    ) => {
      setAppliedFilters((prev) => {
        const newFilters = { ...prev };
        const currentFilterValue = newFilters[filterKey];

        if (valueToRemove && Array.isArray(currentFilterValue)) {
          const updatedArray = (
            currentFilterValue as Array<string | "small" | "medium" | "large">
          ).filter((v) => v !== valueToRemove);

          if (updatedArray.length === 0) {
            delete newFilters[filterKey];
          } else {
            if (
              filterKey === "tags" ||
              filterKey === "license" ||
              filterKey === "file_type"
            ) {
              newFilters[filterKey] = updatedArray.filter(
                (v) => typeof v === "string"
              ) as string[];
            } else if (filterKey === "size_range") {
              newFilters[filterKey] = updatedArray.filter((v) =>
                ["small", "medium", "large"].includes(v)
              ) as Array<"small" | "medium" | "large">;
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
    setCurrentSort("relevance");
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
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
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
            datasets={DUMMY_DATASETS.slice()
              .sort((a, b) => b.downloads_count - a.downloads_count)
              .slice(0, 4)}
          />
          <DatasetCarouselSectionPlaceholder
            title="Recently Added"
            onSeeAll={() => handleCarouselSeeAll("Recently Added")}
            datasets={DUMMY_DATASETS.slice()
              .sort(
                (a, b) =>
                  new Date(b.date_of_creation).getTime() -
                  new Date(a.date_of_creation).getTime()
              )
              .slice(0, 4)}
          />
          <DatasetCarouselSectionPlaceholder
            title="Explore Health & AI"
            onSeeAll={() => handleCarouselSeeAll("Trending Tags")}
            datasets={DUMMY_DATASETS.filter(
              (d) => d.tags?.includes("Health") || d.tags?.includes("AI")
            ).slice(0, 4)}
          />
          {user && (
            <DatasetCarouselSectionPlaceholder
              title="Recommended For You (Climate)"
              onSeeAll={() => handleCarouselSeeAll("Recommended")}
              datasets={DUMMY_DATASETS.filter((d) =>
                d.tags?.includes("Climate")
              ).slice(0, 4)}
            />
          )}
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
                <div className="flex flex-col items-center justify-center h-[30vh]">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    Searching datasets...
                  </p>
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
                onAdvancedFilterToggle={() => {
                  setIsAdvancedDrawerOpen(true);
                }}
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

      <AdvancedFiltersDrawerPlaceholder
        isOpen={isAdvancedDrawerOpen}
        onClose={() => setIsAdvancedDrawerOpen(false)}
        onApply={(advFilters) => {
          console.log("Advanced filters applied", advFilters);
          setAppliedFilters((prev) => ({ ...prev, ...advFilters }));
          setViewMode("results");
        }}
      />
    </div>
  );
}
