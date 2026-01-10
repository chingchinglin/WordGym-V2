import { VocabularyWord, UserSettings, POSType, Filters } from "../types";
import { VersionService } from "../services/VersionService";

export function filterWords(
  words: VocabularyWord[],
  userSettings: UserSettings,
  currentTab: "textbook" | "exam" | "theme",
  filters: Filters,
  quickFilterPos: POSType | "all",
  searchTerm: string,
): VocabularyWord[] {
  const filtered = words.filter((word) => {
    // Stage filter - only apply for textbook and exam tabs
    // Level (theme tab for senior) data is independent of stage
    if (currentTab !== "theme") {
      const normalizedWordStage = VersionService.normalizeStage(
        word.stage || "",
      );
      const normalizedUserStage = VersionService.normalizeStage(
        userSettings.stage || "",
      );
      if (normalizedWordStage !== normalizedUserStage) return false;
    }

    // Tab-specific filters
    switch (currentTab) {
      case "textbook": {
        if (!word.textbook_index || word.textbook_index.length === 0)
          return false;

        const textbookMatch = word.textbook_index?.some((item) => {
          if (!item) return false;
          let match = true;
          // Only check if filter is set
          if (userSettings.version) {
            const normalizedUserVersion = VersionService.normalize(
              userSettings.version,
            );
            const normalizedItemVersion = VersionService.normalize(
              item.version,
            );

            // Strict version matching after normalization
            if (normalizedItemVersion !== normalizedUserVersion) {
              match = false;
            }
          }

          // Issue #69: When searching, skip vol/lesson filters to search across all lessons
          // Only apply vol/lesson filters when NOT searching
          // Issue #62: Also skip if filters are undefined (not yet set to valid values)
          if (!searchTerm) {
            // Only apply vol filter if it's defined and has a value
            if (filters.textbook?.vol !== undefined && filters.textbook.vol !== "") {
              if (item.vol !== filters.textbook.vol) match = false;
            }

            // Support both single lesson (backward compatibility) and multi-select lessons
            // Only apply lesson filter if it's defined and has values
            if (filters.textbook?.lesson !== undefined) {
              const selectedLessons = Array.isArray(filters.textbook.lesson)
                ? filters.textbook.lesson
                : [filters.textbook.lesson];
              // Only filter if there are actual lessons selected
              if (selectedLessons.length > 0 && selectedLessons[0] !== undefined) {
                if (!selectedLessons.includes(item.lesson)) match = false;
              }
            }
          }

          return match;
        });
        if (!textbookMatch) return false;
        break;
      }

      case "exam": {
        const examMatch =
          word.exam_tags?.includes(filters.exam?.year || "") || false;
        if (!examMatch) return false;
        break;
      }

      case "theme": {
        // Use normalized stage for comparison
        const normalizedStageForTheme = VersionService.normalizeStage(
          userSettings.stage || "",
        );

        if (normalizedStageForTheme === "junior") {
          // Junior: Use theme_index
          const themeMatch = word.theme_index?.some(
            (item) =>
              item.range === filters.theme?.range &&
              (filters.theme?.theme
                ? item.theme === filters.theme.theme
                : true),
          );
          if (!themeMatch) return false;
        } else {
          // Senior: Use level and themes
          if (filters.theme?.range) {
            // Check level match - normalize both sides (Level 4 -> L4)
            const normalizedFilterRange = String(filters.theme.range)
              .replace("Level ", "L")
              .trim();
            const normalizedWordLevel = String(word.level || "").trim();
            if (normalizedWordLevel !== normalizedFilterRange) {
              return false;
            }
          }
          // Only check theme if word has themes data AND filter has theme selected
          if (filters.theme?.theme && filters.theme.theme !== "") {
            if (!word.themes || !word.themes.includes(filters.theme.theme)) {
              return false;
            }
          }
        }
        break;
      }
    }

    // POS filter
    if (quickFilterPos !== "all") {
      const posMatch = word.posTags?.includes(quickFilterPos) || false;
      if (!posMatch) return false;
    }

    // Search term filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const wordMatches =
        word.english_word.toLowerCase().includes(searchTermLower) ||
        word.chinese_definition?.toLowerCase().includes(searchTermLower) ||
        word.example_sentence?.toLowerCase().includes(searchTermLower);

      if (!wordMatches) return false;
    }

    return true;
  });

  return filtered;
}
