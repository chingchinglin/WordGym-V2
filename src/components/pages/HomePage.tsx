import React, { useState, useMemo, useRef } from "react";
import { LazyWordCard } from "../cards/LazyWordCard";
import { useCurrentTab } from "../../hooks/useCurrentTab";
import { useTabFilters } from "../../hooks/useTabFilters";
import { useQuickFilterPos } from "../../hooks/useQuickFilterPos";
import { useFavorites } from "../../hooks/useFavorites";
import { useFilteredWordIds } from "../../hooks/useFilteredWordIds";
import { useQuizRange } from "../../hooks/useQuizRange";
import { filterWords } from "../../utils/filterWords";
import { FEATURES } from "../../config/features";
import type { VocabularyWord, UserSettings } from "../../types";
import type { CacheInfo } from "../../hooks/useDataset";

import { QuickPOSFilter } from "../filters/QuickPOSFilter";
import { TextbookFilters } from "../filters/TextbookFilters";
import { ExamFilters } from "../filters/ExamFilters";
import { ThemeFilters } from "../filters/ThemeFilters";

const TABS = {
  textbook: "課本進度",
  theme: "主題探索",
  exam: "大考衝刺",
};

const TAB_TOOLTIPS: Record<string, string> = {
  textbook: "收錄各版本教科書單字，請選擇冊次與課次",
  theme_國中: "依據教育部主題分類學習，請選擇感興趣的分類開始探索（即將推出，敬請期待！）",
  theme_高中: "依據 Level 程度，請選擇感興趣的分類開始探索（即將推出，敬請期待！）",
  exam: "針對歷年會考、學測高頻核心單字進行特訓，請選擇練習目標（即將推出，敬請期待！）",
};

interface HomePageProps {
  words: VocabularyWord[];
  userSettings: UserSettings | null; // Added userSettings prop
  cacheInfo?: CacheInfo; // Cache info for loading state
}

export const HomePage: React.FC<HomePageProps> = ({ words, userSettings, cacheInfo }) => {
  // Removed local useUserSettings() call, now using userSettings prop directly
  const { currentTab, setCurrentTab } = useCurrentTab();
  const { filters, updateFilter } = useTabFilters(userSettings);
  const { quickFilterPos, setQuickFilterPos } = useQuickFilterPos();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { setFilteredWordIds } = useFilteredWordIds();
  const { addToRange } = useQuizRange();

  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Track previous stage/version to detect actual changes (not just mounts)
  const prevSettingsRef = useRef<{ stage?: string; version?: string }>({});

  // Reset to '課本進度' tab ONLY when stage or version actually CHANGES
  // This prevents resetting tab when navigating back from word detail page
  React.useEffect(() => {
    const prevStage = prevSettingsRef.current.stage;
    const prevVersion = prevSettingsRef.current.version;
    const currStage = userSettings?.stage;
    const currVersion = userSettings?.version;

    // Only reset if there's an actual change (not on initial mount or navigation back)
    const stageChanged = prevStage !== undefined && prevStage !== currStage;
    const versionChanged =
      prevVersion !== undefined && prevVersion !== currVersion;

    if (stageChanged || versionChanged) {
      setCurrentTab("textbook");
    }

    // Update the ref for next comparison
    prevSettingsRef.current = { stage: currStage, version: currVersion };
  }, [userSettings?.stage, userSettings?.version, setCurrentTab]);

  // Clear search term and POS filter when switching tabs
  React.useEffect(() => {
    setSearchTerm("");
    if (setQuickFilterPos) {
      setQuickFilterPos("all");
    }
  }, [currentTab, setQuickFilterPos]);

  const handleToggleFavorite = (wordId: number) => {
    if (isFavorite(wordId)) {
      removeFavorite(wordId);
    } else {
      addFavorite(wordId);
    }
  };

  // Show message only if truly no settings
  const isSettingsMissing = !userSettings?.stage || !userSettings?.version;

  // Check if current tab is locked (Coming Soon)
  const isCurrentTabLocked = useMemo(() => {
    if (currentTab === "exam") return !FEATURES.exam;
    if (currentTab === "theme") return !FEATURES.theme;
    return false;
  }, [currentTab]);

  const filteredWords = useMemo(() => {
    if (isSettingsMissing) return [];
    // If tab is locked, return empty array to show Coming Soon
    if (isCurrentTabLocked) return [];
    return filterWords(
      words,
      userSettings,
      currentTab,
      filters,
      quickFilterPos,
      searchTerm,
    );
  }, [
    isSettingsMissing,
    isCurrentTabLocked,
    words,
    userSettings,
    currentTab,
    filters,
    quickFilterPos,
    searchTerm,
  ]);

  // Auto-sync filtered word IDs to global state whenever filters change
  React.useEffect(() => {
    const wordIds = filteredWords.map((word) => word.id);
    setFilteredWordIds(wordIds);
  }, [filteredWords, setFilteredWordIds]);

  // Check if data is loading
  // Show overlay only when: data is actively loading AND no words available yet
  // If we have fallback data (words.length > 0), don't show overlay
  // This allows users to use the app immediately with fallback data while CSV loads in background
  const isLoading = cacheInfo?.isLoading === true && words.length === 0;

  if (isSettingsMissing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">請先選擇您的學程和課本版本</p>
      </div>
    );
  }

  const handleTestRange = () => {
    // Add current filtered words to accumulated range
    const currentWordIds = filteredWords.map((word) => word.id);
    addToRange(currentWordIds);
    
    // Navigate to quiz page without URL params
    // QuizPage will read from sessionStorage (accumulated range)
    window.location.hash = `#/quiz`;
  };

  const handleWordClick = (wordId: number) => {
    // Issue #60: Pass current filter context to word detail page
    // So it can show only the relevant textbook entry
    const vol = filters.textbook?.vol || "";
    const lesson = Array.isArray(filters.textbook?.lesson)
      ? filters.textbook.lesson[0] || ""
      : filters.textbook?.lesson || "";
    const params = new URLSearchParams();
    if (currentTab === "textbook" && vol) params.set("vol", vol);
    if (currentTab === "textbook" && lesson) params.set("lesson", lesson);
    const query = params.toString();
    window.location.hash = `#/word/${wordId}${query ? `?${query}` : ""}`;
  };

  // Map POS to colors (more meaningful than random rotation)
  const getPOSColor = (word: VocabularyWord): string => {
    const def = word.chinese_definition || "";

    // Extract POS from chinese_definition like "(n.)", "(v.)", "(adj.)", etc.
    const posMatch = def.match(/\(([a-z]+\.?)\)/i);
    const pos = posMatch ? posMatch[1].toLowerCase() : "";

    if (pos.startsWith("n")) return "bg-blue-500"; // 名詞 - 藍色
    if (pos.startsWith("v")) return "bg-green-500"; // 動詞 - 綠色
    if (pos.startsWith("adj")) return "bg-purple-500"; // 形容詞 - 紫色
    if (pos.startsWith("adv")) return "bg-pink-500"; // 副詞 - 粉色
    if (pos.startsWith("prep")) return "bg-indigo-500"; // 介係詞 - 靛色
    if (pos.startsWith("conj")) return "bg-yellow-500"; // 連接詞 - 黃色
    if (pos.startsWith("pron")) return "bg-red-500"; // 代名詞 - 紅色

    return "bg-gray-500"; // 其他/未知 - 灰色
  };

  return (
    <div className="container mx-auto p-4 relative">
      {/* Loading Overlay - blocks all interactions when data is loading */}
      {isLoading && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center gap-3 text-white">
            <div 
              className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin" 
              aria-label="資料載入中"
            />
            <div className="text-base font-medium">資料讀取中...</div>
            <div className="text-sm text-white/80">請稍候，正在載入單字資料</div>
          </div>
        </div>
      )}
      
      {/* Main Content - disabled when loading */}
      <div className={isLoading ? "pointer-events-none opacity-50" : ""}>
        {/* Welcome Section */}
        <div className="text-gray-600 mb-6 leading-relaxed space-y-1">
          <p className="text-lg font-medium text-gray-500">
            歡迎來到 WordGym 單字健身坊！
          </p>
          <p className="text-base text-gray-500">
            請從課本進度、大考衝刺或主題探索，選擇想要學習的內容！
          </p>
        </div>

        {/* Tab Navigation - Updated styling to match original */}
        <div className="mb-4 flex flex-wrap gap-4">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCurrentTab(key as "textbook" | "exam" | "theme")}
            onMouseEnter={() => setHoveredTab(key)}
            onMouseLeave={() => setHoveredTab(null)}
            className={`flex-1 sm:flex-none text-lg font-bold px-6 py-3 rounded-full border min-h-[52px] transition-[background-color] duration-200 ease-in-out ${
              currentTab === key
                ? "bg-[#5B56D6] text-white border-transparent shadow-[0_4px_6px_rgba(91,86,214,0.3)]"
                : hoveredTab === key
                  ? "bg-[#F5F5F5] text-gray-700 border-[#E2E8F0]"
                  : "bg-white text-gray-700 border-[#E2E8F0] hover:bg-[#F5F5F5]"
            }`}
          >
            {label}
          </button>
        ))}
        </div>

        {/* Tooltip - shows based on hovered or active tab (Issue #55) */}
        <div className="mb-6 h-8 flex items-center">
        <p
          className="text-sm text-gray-500 transition-opacity duration-150"
          style={{ opacity: 1 }}
        >
          {(() => {
            const tab = hoveredTab || currentTab;
            if (tab === "theme") {
              // 根據學程顯示不同說明
              const stage = userSettings?.stage || "國中";
              return TAB_TOOLTIPS[`theme_${stage}`] || TAB_TOOLTIPS["theme_國中"];
            }
            return TAB_TOOLTIPS[tab];
          })()}
        </p>
        </div>

        {/* Dynamic Filters */}
        {currentTab === "textbook" && (
        <TextbookFilters
          filters={filters.textbook}
          updateFilter={(key, value) => updateFilter("textbook", key, value)}
          userSettings={userSettings}
          dataset={{
            textbook_index: words
              .flatMap((word) => word.textbook_index || [])
              .filter(
                (
                  item,
                ): item is { version: string; vol: string; lesson: string } =>
                  item !== undefined,
              )
              .map((item) => ({
                name: `${item.version} Vol ${item.vol} L${item.lesson}`,
                words: [],
                version: item.version,
                vol: item.vol,
                lesson: item.lesson,
              })),
          }}
        />
        )}

        {currentTab === "exam" && (
        <ExamFilters
          filters={filters.exam}
          updateFilter={(key, value) => updateFilter("exam", key, value)}
          dataset={{ words }}
        />
        )}

        {currentTab === "theme" && (
        <ThemeFilters
          filters={filters.theme}
          updateFilter={(key, value) => updateFilter("theme", key, value)}
          dataset={{
            theme_index: words
              .flatMap((word) => word.theme_index || [])
              .map((item) => ({
                name: `${item.range} - ${item.theme}`,
                words: [],
                range: item.range,
                theme: item.theme,
              })),
            words: words,
          }}
        />
        )}

        {/* Quick POS Filter */}
        <div className="mb-6">
        <label className="block text-sm font-medium text-gray-500 mb-2">
          詞性快篩
        </label>
          <QuickPOSFilter />
        </div>

        {/* Search Bar with Clear Button */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="text"
          placeholder="搜尋單字..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7575FF] focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="whitespace-nowrap px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            清除搜尋
          </button>
        )}
        </div>

        {/* Results Section */}
        <div className="mt-10 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {currentTab === "textbook" && "課本進度"}
              {currentTab === "exam" && "大考衝刺"}
              {currentTab === "theme" && "主題探索"}
            </h2>
            <p className="text-sm text-gray-500">
              符合條件的單字：{filteredWords.length} 筆
              {searchTerm ? `（含搜尋「${searchTerm}」）` : ""}
            </p>
          </div>
          {filteredWords.length > 0 && (
            <button
              onClick={handleTestRange}
              className="ml-auto px-4 py-2 bg-[#66BB6A] text-white font-semibold rounded-lg hover:bg-[#5AA85F] transition-colors"
            >
              測驗此範圍
            </button>
          )}
        </div>

        {/* Word Grid or Coming Soon */}
        {isCurrentTabLocked ? (
          // Coming Soon Card
          <div className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm p-12 text-center">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed text-lg">
                即將推出，敬請期待！
              </p>
              <p className="text-base text-gray-500">
                此功能正在建置中，我們將盡快為您提供完整的學習體驗。
              </p>
              <div className="pt-2">
                <a
                  href="https://forms.gle/SrvhD7T9ZgTiq6dH9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors"
                >
                  新功能上線請通知我
                </a>
              </div>
            </div>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">
              找不到符合條件的單字，請調整篩選條件。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredWords.map((word, index) => {
              const accentColor = getPOSColor(word);
              return (
                <LazyWordCard
                  key={word.id}
                  word={word}
                  index={index}
                  accentColor={accentColor}
                  onClick={() => handleWordClick(word.id)}
                  isFavorite={isFavorite(word.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
