import React, { useMemo } from "react";
import { ThemeIndexItem, VocabularyWord } from "../../types";
import { useUserSettings } from "../../hooks/useUserSettings";
import { VersionService } from "../../services/VersionService";

interface ThemeFiltersProps {
  filters: {
    range?: string;
    theme?: string;
  };
  updateFilter: (key: "range" | "theme", value: string) => void;
  dataset: {
    theme_index: ThemeIndexItem[];
    words: VocabularyWord[];
  };
}

export const ThemeFilters: React.FC<ThemeFiltersProps> = ({
  filters,
  updateFilter,
  dataset,
}) => {
  const { userSettings } = useUserSettings();

  const availableRanges = useMemo(() => {
    if (!userSettings) return [];
    const normalizedStage = VersionService.normalizeStage(
      userSettings.stage || "",
    );
    const ranges =
      normalizedStage === "junior"
        ? ["1200", "800"]
        : ["Level 4", "Level 5", "Level 6"];
    return ranges;
  }, [userSettings]);

  const availableThemes = useMemo(() => {
    if (!userSettings) return [];

    const normalizedStage = VersionService.normalizeStage(
      userSettings.stage || "",
    );
    if (normalizedStage === "junior") {
      // Junior: Use theme_index
      return Array.from(
        new Set(
          dataset.theme_index
            .filter(
              (item) =>
                item.range === filters.range ||
                item.range === availableRanges[0],
            )
            .map((item) => item.theme),
        ),
      ).sort();
    } else {
      // Senior: Use word.themes
      const filteredWords = filters.range
        ? dataset.words.filter(
            (w) =>
              String(w.level || "").trim() === String(filters.range).trim(),
          )
        : dataset.words;

      return Array.from(new Set(filteredWords.flatMap((w) => w.themes || [])))
        .filter(Boolean)
        .sort();
    }
  }, [
    dataset.theme_index,
    dataset.words,
    filters.range,
    availableRanges,
    userSettings,
  ]);

  // Auto-set default range and theme
  React.useEffect(() => {
    if (availableRanges.length > 0) {
      if (!filters.range || !availableRanges.includes(filters.range)) {
        updateFilter("range", availableRanges[0]);
      }
    }
  }, [availableRanges, filters.range, updateFilter]);

  React.useEffect(() => {
    if (availableThemes.length > 0 && availableThemes[0]) {
      if (!filters?.theme || !availableThemes.includes(filters.theme)) {
        updateFilter("theme", availableThemes[0]);
      }
    } else {
      // No themes available - set to empty string
      if (filters?.theme && filters.theme !== "") {
        updateFilter("theme", "");
      }
    }
  }, [availableThemes, filters, updateFilter]);

  const isJunior =
    VersionService.normalizeStage(userSettings?.stage || "") === "junior";

  return (
    <div className={`mb-6 ${isJunior ? "grid gap-4 md:grid-cols-2" : ""}`}>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {VersionService.normalizeStage(userSettings?.stage || "") === "junior"
            ? "2000單"
            : "程度範圍"}
        </label>
        <select
          value={filters.range || availableRanges[0]}
          onChange={(e) => updateFilter("range", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent"
        >
          {availableRanges.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      {VersionService.normalizeStage(userSettings?.stage || "") ===
        "junior" && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">
            主題分類
          </label>
          <select
            value={
              filters.theme ||
              (availableThemes.length > 0 ? availableThemes[0] : "")
            }
            onChange={(e) => updateFilter("theme", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent"
            disabled={availableThemes.length === 0}
          >
            {availableThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
            {availableThemes.length === 0 && (
              <option value="">無可用主題</option>
            )}
          </select>
        </div>
      )}
    </div>
  );
};
