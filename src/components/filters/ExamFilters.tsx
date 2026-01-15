import React, { useMemo } from "react";
import { VocabularyWord } from "../../types";
import { useUserSettings } from "../../hooks/useUserSettings";
import { VersionService } from "../../services/VersionService";

interface ExamFiltersProps {
  filters: {
    year?: string;
  };
  updateFilter: (key: "year", value: string) => void;
  dataset: { words: VocabularyWord[] };
}

export const ExamFilters: React.FC<ExamFiltersProps> = ({
  filters,
  updateFilter,
  dataset,
}) => {
  const { userSettings } = useUserSettings();

  const availableYears = useMemo(() => {
    if (!userSettings) return [];
    const normalizedStage = VersionService.normalizeStage(
      userSettings.stage || "",
    );
    const examTags = dataset.words.flatMap((word) => word.exam_tags || []);
    const uniqueYears = Array.from(new Set(examTags))
      .filter((tag) => {
        const examType =
          normalizedStage === "junior"
            ? tag.includes("會考")
            : tag.includes("學測");
        return examType;
      })
      .sort((a, b) => parseInt(b) - parseInt(a));

    return uniqueYears;
  }, [dataset.words, userSettings]);

  // Set default year to first available year
  React.useEffect(() => {
    if (availableYears.length > 0) {
      // Always set to first available year if current filter doesn't match available years
      if (!filters.year || !availableYears.includes(filters.year)) {
        updateFilter("year", availableYears[0]);
      }
    } else {
      // No years available - set to empty string
      if (filters?.year && filters.year !== "") {
        updateFilter("year", "");
      }
    }
  }, [availableYears, filters.year, updateFilter]);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-500 mb-2">
        年份
      </label>
      <select
        value={filters.year || availableYears[0] || ""}
        onChange={(e) => updateFilter("year", e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7575FF] focus:border-transparent"
        disabled={availableYears.length === 0}
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
        {availableYears.length === 0 && (
          <option value="">內容建置中</option>
        )}
      </select>
    </div>
  );
};
