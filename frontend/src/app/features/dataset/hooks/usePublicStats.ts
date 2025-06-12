import { useState, useEffect } from "react";
import { PublicStats } from "../types/datasetTypes";
import { getPublicStats } from "../services/datasetService";

export const usePublicStats = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicStats();
        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch statistics"
        );
        console.error("Error fetching public stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refetch = async () => {
    try {
      setError(null);
      const data = await getPublicStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch statistics"
      );
      console.error("Error refetching public stats:", err);
    }
  };

  return { stats, loading, error, refetch };
};
