import React, { useMemo, useEffect, useRef } from "react";
import { TextbookIndexItem } from "../../types";
import { useUserSettings } from "../../hooks/useUserSettings";
import { VersionService } from "../../services/VersionService";
import { CustomSelect } from "../ui/CustomSelect";

interface TextbookFiltersProps {
  filters: {
    vol?: string;
    lesson?: string[];
  };
  updateFilter: (key: "vol" | "lesson", value: string | string[]) => void;
  dataset: { textbook_index: TextbookIndexItem[] };
  userSettings?: { version?: string; stage?: string } | null; // Add userSettings prop
}

export const TextbookFilters: React.FC<TextbookFiltersProps> = ({
  filters,
  updateFilter,
  dataset,
  userSettings: userSettingsProp,
}) => {
  // Use prop if provided, otherwise fall back to hook
  // This ensures we use the same userSettings instance as HomePage
  const { userSettings: userSettingsFromHook } = useUserSettings();
  const userSettings = userSettingsProp ?? userSettingsFromHook;
  const prevVolRef = useRef<string | undefined>(filters.vol);
  const prevAvailableVolsRef = useRef<string[]>([]);

  const availableVols = useMemo(() => {
    if (!userSettings?.version || !userSettings.stage) {
      return [];
    }

    // Strict version matching with VersionService
    const filtered = dataset.textbook_index.filter((item) => {
      const normalizedItemVersion = VersionService.normalizeWithGuard(
        item.version,
      );
      const normalizedUserVersion = VersionService.normalizeWithGuard(
        userSettings.version,
      );
      return normalizedItemVersion === normalizedUserVersion;
    });

    const vols = Array.from(
      new Set(filtered.map((item) => item.vol).filter((vol): vol is string => Boolean(vol))),
    ).sort();

    return vols;
  }, [dataset.textbook_index, userSettings?.version, userSettings?.stage]);

  const availableLessons = useMemo(() => {
    if (
      !userSettings?.version ||
      !userSettings.stage ||
      availableVols.length === 0
    )
      return [];

    const normalizedUserVersion = VersionService.normalizeWithGuard(
      userSettings.version,
    );

    return Array.from(
      new Set(
        dataset.textbook_index
          .filter(
            (item) =>
              VersionService.normalizeWithGuard(item.version) ===
                normalizedUserVersion &&
              item.vol === (filters.vol || availableVols[0]),
          )
          .map((item) => item.lesson)
          .filter(Boolean),
      ),
    ).sort();
  }, [
    dataset.textbook_index,
    userSettings?.version,
    userSettings?.stage,
    filters.vol,
    availableVols,
  ]);

  // Sync default vol selection when availableVols changes
  // This effect runs when:
  // 1. availableVols changes from empty to having values (data loaded)
  // 2. availableVols changes and current vol is invalid
  // 3. User just selected a version (availableVols becomes available)
  // CRITICAL: This must run immediately when availableVols becomes available
  useEffect(() => {
    if (availableVols.length > 0 && availableVols[0]) {
      // If no vol selected OR current vol is not in available vols, set to first available
      // This ensures vol is set immediately when version is selected
      if (!filters.vol || !availableVols.includes(filters.vol)) {
        updateFilter("vol", availableVols[0]);
      }
    }
  }, [availableVols, filters.vol, updateFilter]);
  
  // Track previous availableVols to detect when version is first selected
  // This is critical for first-time users: when they select a version in WelcomeModal,
  // availableVols changes from [] to [B1, B2, ...], and we need to set vol immediately
  useEffect(() => {
    const wasEmpty = prevAvailableVolsRef.current.length === 0;
    const nowHasValues = availableVols.length > 0;
    
    // When version is first selected (availableVols goes from empty to having values)
    // AND no vol is currently selected, set it immediately
    if (wasEmpty && nowHasValues && !filters.vol && availableVols[0]) {
      // This is the critical moment: user just selected a version in WelcomeModal
      // We must set vol immediately so the menu appears right away
      updateFilter("vol", availableVols[0]);
    }
    
    prevAvailableVolsRef.current = availableVols;
  }, [availableVols, filters.vol, updateFilter]);

  // Reset lesson selection when vol changes - fixes Issue #70
  useEffect(() => {
    // When vol changes and availableLessons are loaded, ALWAYS reset to first lesson
    const firstLesson = availableLessons[0];
    if (filters.vol && availableLessons.length > 0 && firstLesson) {
      const volActuallyChanged =
        prevVolRef.current !== undefined && prevVolRef.current !== filters.vol;
      const currentLessons = Array.isArray(filters.lesson)
        ? filters.lesson
        : [];
      const hasInvalidLesson = currentLessons.some(
        (l) => !availableLessons.includes(l),
      );

      // Reset lessons if:
      // 1. Volume actually changed (not just initial load), OR
      // 2. Current lessons are invalid for this volume, OR
      // 3. No lessons are currently selected
      if (
        volActuallyChanged ||
        hasInvalidLesson ||
        currentLessons.length === 0
      ) {
        updateFilter("lesson", [firstLesson]);
      }

      // Update the ref for next comparison
      prevVolRef.current = filters.vol;
    }
  }, [filters.vol, availableLessons, updateFilter]);

  // Show message only if:
  // 1. User has selected a version (not first time entering)
  // 2. Dataset has been loaded (textbook_index is not empty)
  // 3. But no matching data for the selected version
  const hasDatasetData = dataset.textbook_index.length > 0;
  const hasUserVersion = !!userSettings?.version && !!userSettings?.stage;
  const shouldShowMessage = availableVols.length === 0 && hasUserVersion && hasDatasetData;

  // If no version selected, don't show filters
  // (HomePage will handle the "請先選擇您的學程和課本版本" message)
  if (!hasUserVersion) {
    return null;
  }

  // Show message if version selected but no matching data
  if (shouldShowMessage) {
    return (
      <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800 font-medium">
          資料建置中...
        </p>
        <p className="text-xs text-blue-700 mt-1">
          「{userSettings?.version}」版本的課本進度資料正在準備中，請稍後再試或切換至「大考衝刺」或「主題探索」模式。
        </p>
      </div>
    );
  }

  // Always show filters UI (even if data is loading or availableVols is empty)
  // This fixes the bug where filters don't appear on first load

  const selectedLessons: string[] =
    filters.lesson ||
    (availableLessons.length > 0 && availableLessons[0]
      ? [availableLessons[0]]
      : []);

  const handleLessonToggle = (lesson: string) => {
    const currentSelection: string[] = Array.isArray(filters.lesson)
      ? filters.lesson.filter((l): l is string => l !== undefined)
      : availableLessons.length > 0 && availableLessons[0]
        ? [availableLessons[0]]
        : [];

    if (currentSelection.includes(lesson)) {
      // Remove lesson if already selected (but keep at least one selected)
      const newSelection = currentSelection.filter((l) => l !== lesson);
      if (newSelection.length > 0) {
        updateFilter("lesson", newSelection);
      }
    } else {
      // Add lesson to selection
      updateFilter("lesson", [...currentSelection, lesson]);
    }
  };

  const handleSelectAll = () => {
    if (availableLessons.length > 0) {
      updateFilter(
        "lesson",
        availableLessons.filter((l): l is string => l !== undefined),
      );
    }
  };

  const handleClearAll = () => {
    if (availableLessons.length > 0 && availableLessons[0]) {
      updateFilter("lesson", [availableLessons[0]]);
    }
  };

  return (
    <div className="mb-6 grid gap-4 grid-cols-1 md:grid-cols-3 md:items-stretch">
      <div className="md:col-span-1 flex flex-col">
        <label className="block text-sm font-medium text-gray-500 mb-2">
          冊次
        </label>
        <CustomSelect
          value={filters.vol || availableVols[0] || ""}
          onChange={(value) => updateFilter("vol", value)}
          options={availableVols.length > 0
            ? availableVols
                .filter((vol): vol is string => vol !== undefined)
                .map((vol) => {
                  // 冊次中文標註映射
                  const volLabelMap: Record<string, string> = {
                    B1: "第一冊",
                    B2: "第二冊",
                    B3: "第三冊",
                    B4: "第四冊",
                    B5: "第五冊",
                    B6: "第六冊",
                  };
                  const chineseLabel = volLabelMap[vol] || "";
                  return {
                    value: vol,
                    label: chineseLabel ? `${vol}(${chineseLabel})` : vol,
                  };
                })
            : [{ value: "", label: hasDatasetData ? "請選擇版本" : "資料載入中..." }]}
          className="w-full"
          disabled={availableVols.length === 0}
        />
      </div>

      <div className="md:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-500">
            課次（可複選）
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              全選
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              清除
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-3 border border-gray-300 rounded-lg bg-white max-h-40 overflow-y-auto min-h-[120px] flex-1">
          {availableLessons.length === 0 ? (
            <div className="col-span-3 sm:col-span-5 flex items-center justify-center text-gray-400 text-sm min-h-[96px]">
              {filters.vol 
                ? (hasDatasetData ? "載入中..." : "資料載入中...") 
                : (availableVols.length > 0 ? "請選擇冊次" : "資料載入中...")}
            </div>
          ) : (
            availableLessons
              .filter((l): l is string => l !== undefined)
              .map((lesson) => (
                <button
                  key={lesson}
                  onClick={() => handleLessonToggle(lesson)}
                  className={`u-style text-sm ${selectedLessons.includes(lesson) ? "selected" : ""}`}
                >
                  {lesson}
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
