import React, { useState, useMemo, useRef } from "react";
import { VocabularyWord } from "../../types";
import { makeCloze, canMakeCloze } from "../../utils/quizHelpers";
import { speak } from "../../utils/speechUtils";
import { Button } from "../ui/Button";
import QuizCompletionScreen from "./QuizCompletionScreen";
import { useFavorites } from "../../hooks/useFavorites";
import { useQuizHistory } from "../../hooks/useQuizHistory";
import { useHashRoute } from "../../hooks/useHashRoute";
import quizOptionsData from "../../data/quiz-options.json";

// Clean word by removing brackets and extra info: "he (him; his)" -> "he"
const cleanWord = (word: string): string => {
  return word.split("(")[0].trim();
};

interface MultipleChoiceQuizProps {
  words: VocabularyWord[];
  onRestart?: () => void;
}

const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({
  words,
  onRestart,
}) => {
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { add: addRecord, history } = useQuizHistory();
  const { hash } = useHashRoute();

  // 鎖住初始 words，避免 CSV 載入完成後 props 更新導致題目跳動
  const stableWordsRef = useRef(words);
  const data = stableWordsRef.current;
  const pool = stableWordsRef.current;
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
  // Only show completion if we have _restart parameter or if this is a return from word detail
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
        completedState.type === "multiple-choice" &&
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

  const validPool = useMemo(() => {
    // Filter words that have example sentences
    const withSentences = pool.filter(
      (w) => w.example_sentence && w.example_sentence.trim(),
    );

    // Prioritize words where the cloze can be made properly (word appears in sentence)
    // Put words with proper cloze first, then words with fallback cloze
    const properCloze = withSentences.filter((w) =>
      canMakeCloze(w.example_sentence || "", cleanWord(w.english_word)),
    );
    const fallbackCloze = withSentences.filter(
      (w) => !canMakeCloze(w.example_sentence || "", cleanWord(w.english_word)),
    );

    // Return proper cloze words first, then fallback (Issue #58)
    return [...properCloze, ...fallbackCloze];
  }, [pool]);

  // Shuffle questions - use all selected words (no limit)
  const shuffledPool = useMemo(() => {
    const shuffled = [...validPool].sort(() => Math.random() - 0.5);
    return shuffled; // Use all words from selected range
  }, [validPool]);

  // Pre-assign correct answer positions (0=A, 1=B, 2=C, 3=D) to ensure even distribution
  const correctAnswerPositions = useMemo(() => {
    const total = shuffledPool.length;
    if (total === 0) return [];

    const baseCount = Math.floor(total / 4);
    const remainder = total % 4;

    const positions = [];
    for (let i = 0; i < 4; i++) {
      const count = baseCount + (i < remainder ? 1 : 0);
      for (let j = 0; j < count; j++) {
        positions.push(i);
      }
    }

    return positions.sort(() => Math.random() - 0.5);
  }, [shuffledPool.length]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime] = useState(() => Date.now());
  const [isFinished, setIsFinished] = useState(shouldShowCompletion);

  // 預生成選項查找表（以 word.id 為 key）
  const quizOptionsMap = useMemo(() => {
    const map = new Map<number, { correctAnswer: string; distractors: { word: string; type: string; reason: string }[] }>();
    for (const entry of quizOptionsData) {
      map.set(entry.id, {
        correctAnswer: entry.correctAnswer,
        distractors: entry.distractors,
      });
    }
    return map;
  }, []);

  const question = useMemo(() => {
    if (shuffledPool.length === 0 || idx >= shuffledPool.length) return null;

    const currentWord = shuffledPool[idx];
    const correctPosition = correctAnswerPositions[idx];

    // 從預生成選項查找表取得選項
    const pregenOptions = quizOptionsMap.get(currentWord.id);
    if (pregenOptions && pregenOptions.correctAnswer && pregenOptions.distractors.length >= 3) {
      const correctAnswer = pregenOptions.correctAnswer;

      // 統一大小寫：所有選項的首字母格式與正確答案一致，避免洩露答案
      const firstChar = correctAnswer.charAt(0);
      const correctIsUpper = firstChar !== firstChar.toLowerCase();
      const distractorWords = pregenOptions.distractors.map(d => {
        const dFirst = d.word.charAt(0);
        const dIsUpper = dFirst !== dFirst.toLowerCase();
        if (correctIsUpper && !dIsUpper) {
          // 正確答案大寫，干擾小寫 → 干擾改大寫
          return dFirst.toUpperCase() + d.word.slice(1);
        }
        if (!correctIsUpper && dIsUpper) {
          // 正確答案小寫，干擾大寫 → 干擾改小寫
          return dFirst.toLowerCase() + d.word.slice(1);
        }
        return d.word;
      });

      const clozedSentence = makeCloze(
        currentWord.example_sentence || "",
        correctAnswer,
      );

      // 偵測空格是否在句首：若是，所有選項首字母大寫
      const blankAtStart = /^\s*_____/.test(clozedSentence);
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

      const finalCorrect = blankAtStart ? capitalize(correctAnswer) : correctAnswer;
      const finalDistractors = blankAtStart
        ? distractorWords.slice(0, 3).map(capitalize)
        : distractorWords.slice(0, 3);

      const finalOptions: string[] = [...finalDistractors];
      const adjustedPosition = Math.min(correctPosition, 3);
      finalOptions.splice(adjustedPosition, 0, finalCorrect);

      return {
        word: currentWord,
        sentence: clozedSentence,
        translation: currentWord.example_translation,
        correctAnswer: finalCorrect,
        options: finalOptions,
      };
    }

    // Fallback: 隨機同詞性單字（理論上不會觸發，因為 quiz-options.json 覆蓋率 100%）
    const correctAnswer = cleanWord(currentWord.english_word);

    // Get current word's POS
    const currentPOS =
      currentWord.posTags && currentWord.posTags.length > 0
        ? currentWord.posTags[0]
        : currentWord.pos;

    // Step 1: Get same POS words from the same pool (current quiz range)
    const samePOSInPool = pool.filter((w) => {
      const wordPOS = w.posTags && w.posTags.length > 0 ? w.posTags[0] : w.pos;

      return (
        wordPOS &&
        currentPOS &&
        wordPOS === currentPOS &&
        w.english_word !== correctAnswer
      );
    });

    const allDistractors: string[] = [];
    const usedWords = new Set<string>(); // Track used words to avoid duplicates

    // Add random words from same POS in pool
    // IMPORTANT: Check for duplicates immediately to avoid issues after deduplication
    const shuffledSamePOS = [...samePOSInPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledSamePOS.length && allDistractors.length < 3; i++) {
      const word = cleanWord(shuffledSamePOS[i].english_word);
      if (!usedWords.has(word.toLowerCase())) {
        allDistractors.push(word);
        usedWords.add(word.toLowerCase());
      }
    }

    // Step 2: If not enough, add random words from pool (any POS)
    // IMPORTANT: Continue checking for duplicates
    if (allDistractors.length < 3) {
      const otherWords = pool.filter(
        (w) => {
          const word = cleanWord(w.english_word);
          return (
            word !== correctAnswer &&
            !usedWords.has(word.toLowerCase())
          );
        },
      );
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);

      for (
        let i = 0;
        i < shuffledOthers.length && allDistractors.length < 3;
        i++
      ) {
        const word = cleanWord(shuffledOthers[i].english_word);
        if (!usedWords.has(word.toLowerCase())) {
          allDistractors.push(word);
          usedWords.add(word.toLowerCase());
        }
      }
    }

    // Step 3: Fallback strategies to ensure exactly 3 distractors
    const fallbackOptions = [
      "apple",
      "banana",
      "computer",
      "develop",
      "education",
      "family",
      "government",
      "history",
      "important",
      "justice",
      "knowledge",
      "language",
      "mountain",
      "nature",
      "organization",
    ];

    while (allDistractors.length < 3) {
      // Try to find unused fallback words
      const unusedFallbacks = fallbackOptions.filter(
        (fb) =>
          fb !== correctAnswer.toLowerCase() &&
          !allDistractors.some((d) => d.toLowerCase() === fb),
      );

      if (unusedFallbacks.length > 0) {
        const randomFallback =
          unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        allDistractors.push(randomFallback);
      } else {
        // Last resort: generate synthetic options
        allDistractors.push(`option_${allDistractors.length + 1}`);
      }
    }

    // At this point, allDistractors should already be unique (checked during collection)
    // But we still ensure uniqueness as a safety measure
    const uniqueDistractors: string[] = [];
    const seen = new Set<string>();
    
    for (const distractor of allDistractors) {
      const lower = distractor.toLowerCase();
      if (!seen.has(lower) && distractor !== correctAnswer) {
        uniqueDistractors.push(distractor);
        seen.add(lower);
        if (uniqueDistractors.length >= 3) break;
      }
    }

    // If we still don't have 3 unique distractors, pad with fallbacks
    // This should rarely happen now since we check for duplicates during collection
    while (uniqueDistractors.length < 3) {
      const unusedFallbacks = fallbackOptions.filter(
        (fb) =>
          fb !== correctAnswer.toLowerCase() &&
          !seen.has(fb.toLowerCase()),
      );

      if (unusedFallbacks.length > 0) {
        const randomFallback =
          unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        uniqueDistractors.push(randomFallback);
        seen.add(randomFallback.toLowerCase());
      } else {
        // Last resort: generate synthetic options (should rarely happen)
        const syntheticOption = `word_${uniqueDistractors.length + 1}`;
        if (!seen.has(syntheticOption.toLowerCase()) && syntheticOption !== correctAnswer) {
          uniqueDistractors.push(syntheticOption);
          seen.add(syntheticOption.toLowerCase());
        } else {
          // Avoid infinite loop
          break;
        }
      }
    }

    const clozedSentence = makeCloze(
      currentWord.example_sentence || "",
      correctAnswer,
    );

    // 偵測空格是否在句首：若是，所有選項首字母大寫
    const blankAtStartFb = /^\s*_____/.test(clozedSentence);
    const capitalizeFb = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const finalCorrectFb = blankAtStartFb ? capitalizeFb(correctAnswer) : correctAnswer;
    const finalDistractorsFb = blankAtStartFb
      ? uniqueDistractors.slice(0, 3).map(capitalizeFb)
      : uniqueDistractors.slice(0, 3);

    // Build final options: ALWAYS exactly 4 options (3 distractors + 1 correct)
    const finalOptions: string[] = [...finalDistractorsFb];

    // Insert correct answer at the predetermined position
    const adjustedPosition = Math.min(correctPosition, 3); // Position must be 0-3
    finalOptions.splice(adjustedPosition, 0, finalCorrectFb);

    console.log(`[Fallback] 題目 ${idx}: wordId=${currentWord.id} 無預生成選項`);

    return {
      word: currentWord,
      sentence: clozedSentence,
      translation: currentWord.example_translation,
      correctAnswer: finalCorrectFb,
      options: finalOptions,
    };
  }, [shuffledPool, idx, correctAnswerPositions, data, quizOptionsMap]);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !question) return;
    setShowResult(true);
    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    let userAnswerDefinition = "";
    if (selectedAnswer && !isCorrect) {
      const foundWord = data.find(
        (w) =>
          w.english_word &&
          w.english_word.toLowerCase() === selectedAnswer.toLowerCase(),
      );
      if (foundWord && foundWord.chinese_definition) {
        userAnswerDefinition = foundWord.chinese_definition;
      } else {
        const foundInPool = pool.find(
          (w) =>
            w.english_word &&
            w.english_word.toLowerCase() === selectedAnswer.toLowerCase(),
        );
        if (foundInPool && foundInPool.chinese_definition) {
          userAnswerDefinition = foundInPool.chinese_definition;
        }
      }
    }

    setAnswers((prev) => [
      ...prev,
      {
        wordId: question.word.id,
        word: question.word.english_word,
        correctAnswer: question.correctAnswer,
        userAnswer: selectedAnswer,
        isCorrect,
        question: question.sentence,
        translation: question.translation,
        wordDefinition: question.word.chinese_definition,
        sentenceTranslation: question.translation,
        userAnswerDefinition: userAnswerDefinition,
      },
    ]);
  };

  const handleNext = () => {
    if (idx < shuffledPool.length - 1) {
      setIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 1000);
      const wrongWords = answers.filter((a) => !a.isCorrect);
      const correctWords = answers.filter((a) => a.isCorrect);

      quizHistoryApi.add({
        type: "multiple-choice",
        totalQuestions: shuffledPool.length,
        correct: score + (selectedAnswer === question?.correctAnswer ? 1 : 0),
        wrong:
          wrongWords.length +
          (selectedAnswer === question?.correctAnswer ? 0 : 1),
        learning: 0,
        wrongWords: wrongWords.map((a) => ({
          wordId: a.wordId,
          word: a.word,
          correctAnswer: a.correctAnswer,
          userAnswer: a.userAnswer,
          question: a.question,
          chinese_definition: a.wordDefinition,
          sentenceTranslation: a.sentenceTranslation,
          userAnswerDefinition: a.userAnswerDefinition,
        })),
        correctWords: correctWords.map((a) => ({
          wordId: a.wordId,
          word: a.word,
          correctAnswer: a.correctAnswer,
          userAnswer: a.userAnswer,
          question: a.question,
          chinese_definition: a.wordDefinition,
          sentenceTranslation: a.sentenceTranslation,
        })),
        duration,
        mode: null,
      });

      sessionStorage.setItem(
        "quiz_completed_state",
        JSON.stringify({
          type: "multiple-choice",
          timestamp: Date.now(),
        }),
      );

      setIsFinished(true);
    }
  };

  // Show completion screen
  if (isFinished) {
    const history = quizHistoryApi.getAll();
    const latest = history[0];

    if (latest && latest.type === "multiple-choice") {
      return (
        <QuizCompletionScreen
          type="multiple-choice"
          totalQuestions={latest.totalQuestions}
          correct={latest.correct}
          wrong={latest.wrong}
          learning={0}
          wrongWords={latest.wrongWords || []}
          correctWords={latest.correctWords || []}
          learningWords={[]}
          favoritesApi={favoritesApi}
          onRestart={handleRestartClick}
          data={data}
        />
      );
    }

    // Fallback
    const wrongAnswers = answers.filter((a) => !a.isCorrect);
    const correctAnswers = answers.filter((a) => a.isCorrect);
    const correctCount = score;
    const wrongCount = wrongAnswers.length;
    const totalCount = shuffledPool.length;

    return (
      <QuizCompletionScreen
        type="multiple-choice"
        totalQuestions={totalCount}
        correct={correctCount}
        wrong={wrongCount}
        learning={0}
        wrongWords={wrongAnswers}
        correctWords={correctAnswers}
        learningWords={[]}
        favoritesApi={favoritesApi}
        onRestart={handleRestartClick}
        data={data}
      />
    );
  }

  if (shuffledPool.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-2xl">
        <p className="text-gray-600">沒有可用的題目（需要有例句的單字）</p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">實力驗收</h1>
      {/* Quiz Mode Selection Buttons */}
      <div className="mb-3 md:mb-4 flex gap-2 md:gap-3">
        <button className="flex-1 px-4 md:px-8 py-2 md:py-3 rounded-xl bg-indigo-600 text-white text-sm md:text-lg font-medium transition">
          選擇題
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(hash.split("?")[1] || "");
            params.set("type", "flashcard");
            window.location.hash = `#/quiz?${params.toString()}`;
          }}
          className="flex-1 px-4 md:px-8 py-2 md:py-3 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm md:text-lg font-medium hover:bg-gray-50 transition"
        >
          閃卡
        </button>
        <button
          onClick={() => (window.location.hash = "#/quiz-history")}
          className="hidden md:flex flex-1 px-8 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-200 transition"
        >
          查看歷史記錄
        </button>
      </div>

      <div className="mb-3 md:mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          第 {idx + 1} 題 / {shuffledPool.length} 題
        </div>
        <div className="text-base md:text-lg font-semibold text-indigo-600">
          得分：{score} / {idx + (showResult ? 1 : 0)}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-white p-4 md:p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-2 md:mb-3">
          請選出句中最適合的單字：
        </p>

        <p className="text-base md:text-lg mb-4 md:mb-6 leading-relaxed">{question.sentence}</p>

        {showResult && question.translation && (
          <p className="text-sm text-gray-500 mb-3 md:mb-6 italic">
            {question.translation}
          </p>
        )}

        {/* 選項 */}
        <div className="mb-3 md:mb-4">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3">
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              let bgColor = "bg-white border-gray-300";
              if (showCorrect) bgColor = "bg-green-100 border-green-500";
              else if (showWrong) bgColor = "bg-red-100 border-red-500";
              else if (isSelected) bgColor = "bg-indigo-50 border-indigo-500";

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(option)}
                  disabled={showResult}
                  className={`${bgColor} border-2 rounded-xl p-3 md:p-4 text-left transition hover:shadow-md disabled:cursor-not-allowed text-sm md:text-base`}
                >
                  <span className="font-medium">
                    {String.fromCharCode(65 + i)}.
                  </span>{" "}
                  {option}
                  {showCorrect && <span className="ml-2">✓</span>}
                  {showWrong && <span className="ml-2">✗</span>}
                </button>
              );
            })}
          </div>
        </div>

        {showResult && (
          <div
            className={`p-3 md:p-4 rounded-xl ${
              selectedAnswer === question.correctAnswer
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-medium">
                  {selectedAnswer === question.correctAnswer
                    ? "✓ 答對了！"
                    : "✗ 答錯了"}
                </span>
                <span className="ml-2 text-sm">
                  正確答案：<span className="font-semibold">{question.correctAnswer}</span>
                  {question.word.chinese_definition && (
                    <span className="text-gray-600 ml-1">({question.word.chinese_definition})</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => speak(question.correctAnswer, 'word')}
                className="hidden md:inline-flex px-3 py-2 rounded-lg border border-gray-300 hover:bg-white/50 transition text-sm"
                title="發音"
              >
                🔊 聽發音
              </button>
            </div>
          </div>
        )}

        {/* Desktop action button — right-aligned, switches between submit and next */}
        <div className="hidden md:flex justify-end mt-4">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedAnswer}>
              提交答案
            </Button>
          ) : (
            <Button onClick={handleNext} className="px-6">
              下一題 →
            </Button>
          )}
        </div>
      </div>

      {/* Mobile fixed bottom action bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 shadow-lg z-50">
        {!showResult ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="flex-1 py-3 text-base"
          >
            提交答案
          </Button>
        ) : (
          <>
            <Button
              onClick={handleNext}
              className="flex-1 py-3 text-base"
            >
              下一題 →
            </Button>
            <button
              onClick={() => speak(question.correctAnswer, 'word')}
              className="px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
              title="發音"
            >
              🔊
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceQuiz;
