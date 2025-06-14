import { useQuery } from "@tanstack/react-query";
import { getAvailableFileTypes } from "../services/datasetService";

export const useAvailableFileTypes = () => {
  return useQuery({
    queryKey: ["availableFileTypes"],
    queryFn: getAvailableFileTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes - file types don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in newer versions)
  });
};
