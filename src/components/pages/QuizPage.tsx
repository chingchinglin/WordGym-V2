import React, { useMemo } from "react";
import { VocabularyWord, UserSettings } from "../../types";
import { useHashRoute } from "../../hooks/useHashRoute";
import { useFilteredWordIds } from "../../hooks/useFilteredWordIds";
import { useQuizRange } from "../../hooks/useQuizRange";
import { VersionService } from "../../services/VersionService";
import MultipleChoiceQuiz from "../quiz/MultipleChoiceQuiz";
import FlashcardQuiz from "../quiz/FlashcardQuiz";

interface QuizPageProps {
  words: VocabularyWord[];
  userSettings: UserSettings | null;
}

export const QuizPage: React.FC<QuizPageProps> = ({ words, userSettings }) => {
  const { hash, push } = useHashRoute();
  const { filteredWordIds, setFilteredWordIds } = useFilteredWordIds();
  const { clearRange, accumulatedIds } = useQuizRange();

  // Parse URL params
  const params = useMemo(() => {
    return new URLSearchParams(hash.split("?")[1] || "");
  }, [hash]);

  const quizType = params.get("type") || "selection";
  const restartKey = `${quizType}-${params.get("_restart") || "0"}`;

  // Filter words by version first
  const versionFilteredWords = useMemo(() => {
    if (!userSettings) return words;

    const normalizedUserStage = VersionService.normalizeStage(
      userSettings.stage || "",
    );

    return words.filter((word) => {
      // Stage filter
      const normalizedWordStage = VersionService.normalizeStage(
        word.stage || "",
      );
      return normalizedWordStage === normalizedUserStage;
    });
  }, [words, userSettings]);

  // Parse word IDs from URL params OR use accumulated range OR use global filtered word IDs
  const quizWords = useMemo(() => {
    const wordIdsParam = params.get("words");

    // Priority 1: URL params (explicit range, e.g., from FavoritesPage or direct navigation)
    // This takes precedence and does NOT use accumulated range
    if (wordIdsParam) {
      const wordIds = wordIdsParam.split(",").map((id) => parseInt(id, 10));
      return words.filter((w) => wordIds.includes(w.id));
    }

    // Priority 2: Accumulated range from sessionStorage (from HomePage "測驗此範圍" button)
    try {
      const accumulatedRange = sessionStorage.getItem("wordgym_quiz_range_v1");
      if (accumulatedRange) {
        const wordIds = JSON.parse(accumulatedRange) as number[];
        if (wordIds.length > 0) {
          return words.filter((w) => wordIds.includes(w.id));
        }
      }
    } catch (error) {
      console.error("Failed to read accumulated quiz range:", error);
    }

    // Priority 3: Global filtered word IDs (from HomePage filter state, backward compatibility)
    if (filteredWordIds && filteredWordIds.length > 0) {
      return words.filter((w) => filteredWordIds.includes(w.id));
    }

    // Priority 4: Empty (show prompt to select range)
    return [];
  }, [params, words, filteredWordIds, versionFilteredWords]);

  const validQuizWords = useMemo(() => {
    // Filter words that have example sentences for multiple choice quiz
    return quizWords.filter(
      (w) => w.example_sentence && w.example_sentence.trim(),
    );
  }, [quizWords]);

  const handleStartMultipleChoice = () => {
    const currentParams = new URLSearchParams(hash.split("?")[1] || "");
    currentParams.set("type", "multiple-choice");
    currentParams.delete("_restart"); // Remove restart flag if exists
    push(`#/quiz?${currentParams.toString()}`);
  };

  const handleStartFlashcard = () => {
    const currentParams = new URLSearchParams(hash.split("?")[1] || "");
    currentParams.set("type", "flashcard");
    currentParams.delete("_restart"); // Remove restart flag if exists
    push(`#/quiz?${currentParams.toString()}`);
  };

  const handleViewHistory = () => {
    push("#/quiz-history");
  };

  const handleRestart = () => {
    sessionStorage.removeItem("quiz_completed_state");
    sessionStorage.removeItem("quiz_return_path");
    const currentParams = new URLSearchParams(hash.split("?")[1] || "");
    currentParams.set("_restart", Date.now().toString());
    push(`#/quiz?${currentParams.toString()}`);
  };

  if (quizWords.length === 0) {
    return (
      <div className="bg-gray-50 pb-8">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Vertical center aligned flex container */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Text content on left with increased padding */}
              <div className="flex-1 text-left pl-4 md:pl-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  實力驗收（0）
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  你還沒有選擇挑戰範圍喔！
                  <br />
                  請先在「單字卡」熟悉內容，累積足夠實力後再來這裡進行挑戰！
                </p>
                <button
                  onClick={() => (window.location.hash = "#/")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition duration-150"
                >
                  立即前往單字卡
                </button>
              </div>

              {/* Image on right with eager loading - WebP for faster load */}
              <div className="flex-1">
                <picture>
                  <source srcSet="./images/quiz-boy.webp" type="image/webp" />
                  <img
                    src="./images/quiz-boy.png"
                    alt="健身男孩插圖"
                    className="w-full max-w-md mx-auto"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render quiz based on type
  if (quizType === "multiple-choice") {
    return (
      <MultipleChoiceQuiz
        key={`multiple-choice-${restartKey}`}
        words={quizWords}
        onRestart={handleRestart}
      />
    );
  }

  if (quizType === "flashcard") {
    return (
      <FlashcardQuiz
        key={`flashcard-${restartKey}`}
        words={quizWords}
        onRestart={handleRestart}
      />
    );
  }

  // Selection screen
  return (
    <div className="bg-gray-50 pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl shadow-lg border-t-4 border-indigo-600 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          實力驗收
        </h1>
        <div className="flex items-center justify-between mb-6">
          <p className="text-base text-gray-600">
            你已選擇練習{" "}
            <span className="font-bold text-indigo-600">{quizWords.length}</span>{" "}
            題
          </p>
          {quizWords.length > 0 && (
            <button
              onClick={() => {
                // Clear all possible sources
                clearRange(); // Clear sessionStorage accumulated range
                setFilteredWordIds([]); // Clear localStorage filtered word IDs
                // Navigate to quiz page without params to show empty state
                // This will trigger quizWords to become empty array
                push("#/quiz");
              }}
              className="px-4 py-2 text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="清除測驗範圍"
            >
              清除測驗範圍
            </button>
          )}
        </div>

        {/* Warning when less than 5 questions */}
        {quizWords.length > 0 && quizWords.length < 5 && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">提醒：</span>建議累積至少 5
              題再進行測驗，以確保測驗選項充足（目前 {quizWords.length} 題）
            </p>
          </div>
        )}

        <div className="flex flex-col items-center space-y-4">
          {/* Multiple Choice Button */}
          <button
            onClick={handleStartMultipleChoice}
            disabled={validQuizWords.length === 0 || quizWords.length < 5}
            className={`w-full max-w-md py-4 px-6 rounded-2xl text-white font-bold text-xl transition shadow-lg ${
              validQuizWords.length === 0 || quizWords.length < 5
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl"
            }`}
          >
            選擇題
            {validQuizWords.length === 0 && quizWords.length >= 5 && (
              <span className="block text-sm font-normal mt-1">
                （需要有例句的單字）
              </span>
            )}
          </button>

          {/* Flashcard Button */}
          <button
            onClick={handleStartFlashcard}
            disabled={quizWords.length < 5}
            className={`w-full max-w-md py-4 px-6 rounded-2xl font-bold text-xl transition shadow-md hover:shadow-lg ${
              quizWords.length < 5
                ? "bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed"
                : "bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            閃卡
          </button>

          {/* Quiz History Button */}
          <button
            onClick={handleViewHistory}
            className="w-full max-w-md py-4 px-6 rounded-2xl bg-white border-2 border-gray-300 text-gray-700 font-bold text-xl hover:bg-gray-50 transition shadow-md hover:shadow-lg"
          >
            查看歷史記錄
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
