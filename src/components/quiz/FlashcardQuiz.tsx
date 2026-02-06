import React, { useState, useMemo } from "react";
import { VocabularyWord } from "../../types";
import { speak, isSpeaking } from "../../utils/speechUtils";
import { Button } from "../ui/Button";
import QuizCompletionScreen from "./QuizCompletionScreen";
import { useFavorites } from "../../hooks/useFavorites";
import { useQuizHistory } from "../../hooks/useQuizHistory";
import { useHashRoute } from "../../hooks/useHashRoute";
import SpeakerButton from "../ui/SpeakerButton";

interface FlashcardQuizProps {
  words: VocabularyWord[];
  onRestart?: () => void;
}

// Clean brackets from english_word (e.g., "he (him; his; himself)" → "he")
const cleanWord = (word: string): string => {
  return word.split("(")[0].trim();
};

const FlashcardQuiz: React.FC<FlashcardQuizProps> = ({ words, onRestart }) => {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { add: addRecord, history } = useQuizHistory();
  const { hash } = useHashRoute();

  const data = words;
  const pool = words; // Use words directly from props (already filtered by QuizPage)
  const favoritesApi = {
    favorites: Array.from(favorites),
    toggle: (id: number) => {
      if (favorites.has(id)) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
    },
  };
  const quizHistoryApi = {
    add: addRecord,
    getAll: () => history,
  };
  const handleRestartClick =
    onRestart ||
    (() => {
      window.location.hash = "#/quiz";
    });
  // Check if we should show completion screen directly
  // Only show completion if we're returning from word detail page, not when starting fresh
  const shouldShowCompletion = (() => {
    const params = new URLSearchParams(hash.split("?")[1] || "");
    const hasRestart = params.has("_restart");

    // If _restart parameter exists, never show completion (user wants to restart)
    if (hasRestart) {
      return false;
    }

    // Otherwise check if we just completed and are returning
    try {
      const completedState = JSON.parse(
        sessionStorage.getItem("quiz_completed_state") || "null",
      );
      const returnPath = JSON.parse(
        sessionStorage.getItem("quiz_return_path") || "null",
      );

      // Only show completion if:
      // 1. We have a completion state for this quiz type
      // 2. It's recent (within 1 hour)
      // 3. We're returning from a word detail page
      if (
        completedState &&
        completedState.type === "flashcard" &&
        completedState.timestamp &&
        Date.now() - completedState.timestamp < 3600000 &&
        returnPath &&
        Date.now() - returnPath.timestamp < 60000
      ) {
        // Within 1 minute
        return true;
      }
    } catch {
      /* ignore parse error */
    }
    return false;
  })();

  const shuffledPool = useMemo(() => {
    if (!pool || pool.length === 0) return [];
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Use all cards from the pool (no longer limited to 5)
    return shuffled;
  }, [pool]);

  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState("en-to-zh");
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime] = useState(() => Date.now());
  const [isFinished, setIsFinished] = useState(shouldShowCompletion);

  const isFinishedCheck = idx >= shuffledPool.length || isFinished;
  const currentCard = isFinishedCheck ? null : shuffledPool[idx];

  const handleFlip = () => {
    if (!isFinishedCheck) {
      // 如果正在播放語音，禁止翻面
      if (isSpeaking()) {
        console.log('[FlashcardQuiz] 語音播放中，禁止翻面');
        return;
      }
      // Removed logging;
      setFlipped((f) => !f);
    }
  };

  const handleNext = (isKnown: boolean) => {
    // Removed logging;
    const currentWord = shuffledPool[idx];
    if (!currentWord) {
      console.error("currentWord 為空", {
        idx,
        shuffledPoolLength: shuffledPool.length,
      });
      return;
    }
    const status = isKnown ? "correct" : "learning";

    const currentAnswer = {
      wordId: currentWord.id,
      word: currentWord.english_word,
      status,
      isCorrect: isKnown,
    };

    setAnswers((prev) => [...prev, currentAnswer]);

    const newKnown = isKnown ? known + 1 : known;
    const newLearning = isKnown ? learning : learning + 1;

    if (idx < shuffledPool.length - 1) {
      // Removed unused nextIdx
      setIdx((prevIdx) => {
        const newIdx = prevIdx + 1;
        // Removed logging;
        return newIdx;
      });
      setFlipped(false);
      setKnown(newKnown);
      setLearning(newLearning);
    } else {
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 1000);
      const allAnswers = [...answers, currentAnswer];
      const learningWords = allAnswers.filter((a) => a.status === "learning");
      const correctWords = allAnswers.filter((a) => a.isCorrect);

      setKnown(newKnown);
      setLearning(newLearning);

      quizHistoryApi.add({
        type: "flashcard",
        totalQuestions: shuffledPool.length,
        correct: newKnown,
        wrong: 0,
        learning: newLearning,
        wrongWords: [],
        learningWords: learningWords.map((a) => ({
          wordId: a.wordId,
          word: a.word,
        })),
        correctWords: correctWords.map((a) => a.wordId),
        duration,
        mode,
      });

      sessionStorage.setItem(
        "quiz_completed_state",
        JSON.stringify({
          type: "flashcard",
          timestamp: Date.now(),
        }),
      );

      setIsFinished(true);
    }
  };

  const toggleMode = () => {
    if (!isFinished) {
      setMode((m) => (m === "en-to-zh" ? "zh-to-en" : "en-to-zh"));
      setFlipped(false);
    }
  };

  if (shuffledPool.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-2xl">
        <p className="text-gray-600">沒有可用的閃卡</p>
      </div>
    );
  }

  if (isFinished) {
    const history = quizHistoryApi.getAll();
    const latest = history[0];

    if (latest && latest.type === "flashcard") {
      return (
        <QuizCompletionScreen
          type="flashcard"
          totalQuestions={latest.totalQuestions}
          correct={latest.correct}
          wrong={0}
          learning={latest.learning}
          wrongWords={[]}
          learningWords={latest.learningWords || []}
          favoritesApi={favoritesApi}
          onRestart={handleRestartClick}
          data={data}
        />
      );
    }

    const allAnswers = answers;
    const learningWords = allAnswers.filter((a) => a.status === "learning");
    const correctCount = known;
    const learningCount = learning;
    const totalCount = shuffledPool.length;

    return (
      <QuizCompletionScreen
        type="flashcard"
        totalQuestions={totalCount}
        correct={correctCount}
        wrong={0}
        learning={learningCount}
        wrongWords={[]}
        learningWords={learningWords}
        favoritesApi={favoritesApi}
        onRestart={handleRestartClick}
        data={data}
      />
    );
  }

  if (!currentCard) return null;

  // 取得詞性顯示文字
  const getPosDisplay = (word: VocabularyWord): string => {
    const pos = word.posTags?.[0] || word.pos;
    if (!pos) return "";
    // 詞性縮寫對照
    const posMap: Record<string, string> = {
      noun: "n.",
      verb: "v.",
      adjective: "adj.",
      adverb: "adv.",
      preposition: "prep.",
      conjunction: "conj.",
      interjection: "interj.",
      pronoun: "pron.",
      phrase: "phr.",
      other: "",
    };
    return posMap[pos] || pos;
  };

  const posDisplay = getPosDisplay(currentCard);
  const frontText =
    mode === "en-to-zh"
      ? cleanWord(currentCard.english_word)
      : currentCard.chinese_definition || "(無中文翻譯)";

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">實力驗收</h1>
      {/* Quiz Mode Selection Buttons */}
      <div className="mb-3 md:mb-4 flex gap-2 md:gap-3">
        <button
          onClick={() => {
            const params = new URLSearchParams(hash.split("?")[1] || "");
            params.set("type", "multiple-choice");
            window.location.hash = `#/quiz?${params.toString()}`;
          }}
          className="flex-1 px-4 md:px-8 py-2 md:py-3 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm md:text-lg font-medium hover:bg-gray-50 transition"
        >
          選擇題
        </button>
        <button className="flex-1 px-4 md:px-8 py-2 md:py-3 rounded-xl bg-indigo-600 text-white text-sm md:text-lg font-medium transition">
          閃卡
        </button>
        <button
          onClick={() => (window.location.hash = "#/quiz-history")}
          className="hidden md:flex flex-1 px-8 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-200 transition"
        >
          查看歷史記錄
        </button>
      </div>

      <div className="mb-3 md:mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-600">
          第 {idx + 1} 張 / {shuffledPool.length} 張
        </div>
        <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
          <span className="text-green-600">✓ 熟悉：{known}</span>
          <span className="text-orange-600">學習中：{learning}</span>
        </div>
        <Button variant="ghost" onClick={toggleMode} className="text-xs md:text-sm px-2 py-1">
          {mode === "en-to-zh" ? "英→中" : "中→英"}
        </Button>
      </div>

      <div
        className={`flashcard ${flipped ? "flipped" : ""} cursor-pointer`}
        onClick={handleFlip}
      >
        <div className="flashcard-inner h-[260px] md:h-[320px]">
          <div className="flashcard-front">
            <div className="rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-white p-6 md:p-8 shadow-lg h-full w-full flex flex-col items-center justify-center">
              <div className="text-xs text-gray-500 mb-3 md:mb-4">點擊卡片翻面</div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="text-2xl md:text-4xl font-bold text-center">
                  {frontText}
                  {mode === "en-to-zh" && posDisplay && (
                    <span className="text-lg md:text-2xl font-normal text-gray-400 ml-2">
                      ({posDisplay})
                    </span>
                  )}
                </div>
                {mode === "en-to-zh" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(frontText, 'word');
                    }}
                    className="flex-shrink-0 h-6 w-6 rounded-full border border-indigo-300 bg-white text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center"
                    title="播放發音"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-3 w-3"
                    >
                      <path d="M4 9.25v5.5c0 .69.56 1.25 1.25 1.25H7l3.29 2.63c.83.66 2.04.07 2.04-1V6.62c0-1.07-1.21-1.66-2.04-1L7 8.25H5.25C4.56 8.25 4 8.81 4 9.25Zm11.21-2.46a.75.75 0 0 0-.97 1.14 4.5 4.5 0 0 1 0 7.14.75.75 0 0 0 .97 1.14 6 6 0 0 0 0-9.42Zm2.79-1.95a.75.75 0 0 0-.97 1.13 7.5 7.5 0 0 1 0 11.56.75.75 0 0 0 .97 1.13 9 9 0 0 0 0-13.82Z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flashcard-back">
            <div className="rounded-2xl border-4 border-indigo-600 bg-white p-4 md:p-6 pt-6 md:pt-8 shadow-xl h-full w-full flex flex-col justify-start items-start text-left relative overflow-y-auto">
              {(mode === "en-to-zh" || mode === "zh-to-en") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(cleanWord(currentCard.english_word), 'word');
                  }}
                  className="absolute top-3 md:top-5 right-3 md:right-5 w-8 md:w-10 h-8 md:h-10 rounded-full bg-gray-50 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition"
                  title="播放發音"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 md:h-5 w-4 md:w-5"
                  >
                    <path d="M4 9.25v5.5c0 .69.56 1.25 1.25 1.25H7l3.29 2.63c.83.66 2.04.07 2.04-1V6.62c0-1.07-1.21-1.66-2.04-1L7 8.25H5.25C4.56 8.25 4 8.81 4 9.25Zm11.21-2.46a.75.75 0 0 0-.97 1.14 4.5 4.5 0 0 1 0 7.14.75.75 0 0 0 .97 1.14 6 6 0 0 0 0-9.42Zm2.79-1.95a.75.75 0 0 0-.97 1.13 7.5 7.5 0 0 1 0 11.56.75.75 0 0 0 .97 1.13 9 9 0 0 0 0-13.82Z" />
                  </svg>
                </button>
              )}

              <div className="w-full flex-1">
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
                  {cleanWord(currentCard.english_word)}
                  {posDisplay && (
                    <span className="text-base md:text-xl font-normal text-gray-400 ml-2">
                      ({posDisplay})
                    </span>
                  )}
                </div>
                <div className="text-sm md:text-base text-gray-500 font-medium mt-1 md:mt-2">
                  {currentCard.chinese_definition || "(無中文翻譯)"}
                </div>

                {currentCard.example_sentence && (
                  <div className="w-full mt-3 md:mt-6 pl-3 md:pl-4 border-l-4 border-indigo-400">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="text-lg md:text-2xl font-bold text-gray-800 leading-snug">
                          {currentCard.example_sentence}
                        </div>
                        {currentCard.example_translation && (
                          <div className="text-xs md:text-sm text-gray-400 mt-1 md:mt-2">
                            {currentCard.example_translation}
                          </div>
                        )}
                      </div>
                      <SpeakerButton
                        onClick={() => speak(currentCard.example_sentence!, 'example1')}
                        label="播放例句發音"
                        className="mt-0.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 電腦版：按鈕整合在卡片內部底端 */}
              <div className="hidden md:flex w-full justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <Button
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext(false);
                  }}
                  disabled={isFinished}
                  className="px-8"
                >
                  還不熟
                </Button>
                <Button
                  variant="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext(true);
                  }}
                  disabled={isFinished}
                  className="px-8"
                >
                  我記得了 ✓
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom action bar */}
      {flipped && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 shadow-lg z-50">
          <Button
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              handleNext(false);
            }}
            disabled={isFinished}
            className="flex-1 py-3 text-base"
          >
            還不熟
          </Button>
          <Button
            variant="success"
            onClick={(e) => {
              e.stopPropagation();
              handleNext(true);
            }}
            disabled={isFinished}
            className="flex-1 py-3 text-base"
          >
            我記得了 ✓
          </Button>
        </div>
      )}

      <style>{`
        .flashcard {
          perspective: 1000px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 1200px;
          min-width: 280px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (min-width: 768px) {
          .flashcard {
            margin-bottom: 24px;
          }
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flashcard.flipped .flashcard-inner {
          transform: rotateY(180deg);
        }
        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .flashcard-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default FlashcardQuiz;
