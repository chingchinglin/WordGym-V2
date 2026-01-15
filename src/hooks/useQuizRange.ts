import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wordgym_quiz_range_v1";

/**
 * Hook to manage accumulated quiz range in sessionStorage
 * - Only accumulates when explicitly called from HomePage
 * - Provides methods to add, clear, and get accumulated word IDs
 */
export function useQuizRange() {
  const [accumulatedIds, setAccumulatedIds] = useState<number[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync state with sessionStorage
  useEffect(() => {
    try {
      if (accumulatedIds.length > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(accumulatedIds));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save quiz range to sessionStorage:", error);
    }
  }, [accumulatedIds]);

  /**
   * Add word IDs to accumulated range (with deduplication)
   */
  const addToRange = useCallback((wordIds: number[]) => {
    setAccumulatedIds((prev) => {
      const combined = [...prev, ...wordIds];
      // Deduplicate using Set
      const unique = Array.from(new Set(combined));
      return unique;
    });
  }, []);

  /**
   * Clear accumulated range
   */
  const clearRange = useCallback(() => {
    setAccumulatedIds([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear quiz range from sessionStorage:", error);
    }
  }, []);

  /**
   * Get accumulated word IDs
   */
  const getRange = useCallback(() => {
    return accumulatedIds;
  }, [accumulatedIds]);

  return {
    accumulatedIds,
    addToRange,
    clearRange,
    getRange,
  };
}
