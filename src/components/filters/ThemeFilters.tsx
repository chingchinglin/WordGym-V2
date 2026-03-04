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
        : ["L1", "L2", "L3", "L4", "L5", "L6"]; // 高中使用 L1-L6 對應 level 欄位
    return ranges;
  }, [userSettings]);

  const availableThemes = useMemo(() => {
    if (!userSettings) return [];

    const normalizedStage = VersionService.normalizeStage(
      userSettings.stage || "",
    );
    if (normalizedStage === "junior") {
      // Junior: Use theme_index - only show themes that have data for selected range
      const selectedRange = filters.range || availableRanges[0];
      return Array.from(
        new Set(
          dataset.theme_index
            .filter((item) => item.range === selectedRange)
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

  // Level labels for senior (參考詞彙表 levels)
  const levelLabels: Record<string, string> = {
    L1: "Level 1",
    L2: "Level 2",
    L3: "Level 3",
    L4: "Level 4",
    L5: "Level 5",
    L6: "Level 6",
  };

  // Range labels for junior (2000單)
  const rangeLabels: Record<string, string> = {
    "1200": "基本1200",
    "800": "常用800",
  };

  return (
    <div className={`mb-6 ${isJunior ? "grid gap-4 md:grid-cols-2" : ""}`}>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {isJunior ? "2000單範圍" : "詞彙表級別"}
        </label>
        {isJunior ? (
          // 國中：使用下拉式選單
          <select
            value={filters.range || availableRanges[0]}
            onChange={(e) => updateFilter("range", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7575FF] focus:border-transparent bg-white text-gray-900"
            style={{ colorScheme: "light" }}
          >
            {availableRanges.map((range) => (
              <option key={range} value={range}>
                {rangeLabels[range] || range}
              </option>
            ))}
          </select>
        ) : (
          // 高中：使用六個按鈕（與詞性快篩樣式一致）
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {availableRanges.map((range) => (
              <button
                key={range}
                onClick={() => updateFilter("range", range)}
                className={`u-style text-sm ${filters.range === range ? "selected" : ""}`}
                type="button"
              >
                {levelLabels[range] || range}
              </button>
            ))}
          </div>
        )}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7575FF] focus:border-transparent bg-white text-gray-900"
            style={{ colorScheme: "light" }}
            disabled={availableThemes.length === 0}
          >
            {availableThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
            {availableThemes.length === 0 && (
              <option value="">內容建置中</option>
            )}
          </select>
        </div>
      )}

      {/* 高中：目前主題資料尚未建置，只顯示程度篩選 */}
    </div>
  );
};
