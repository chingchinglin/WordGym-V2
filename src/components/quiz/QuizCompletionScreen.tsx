import React, { useState } from "react";
import { VocabularyWord } from "../../types";
import { Button } from "../ui/Button";

interface QuizCompletionScreenProps {
  type: "multiple-choice" | "flashcard";
  totalQuestions: number;
  correct: number;
  wrong: number;
  learning: number;
  wrongWords: Array<{
    wordId: number;
    word: string;
    correctAnswer?: string;
    userAnswer?: string;
    question?: string;
    chinese_definition?: string;
    sentenceTranslation?: string;
    userAnswerDefinition?: string;
  }>;
  correctWords?: Array<{
    wordId: number;
    word: string;
    correctAnswer?: string;
    userAnswer?: string;
    question?: string;
    chinese_definition?: string;
    sentenceTranslation?: string;
  }>;
  learningWords: Array<{
    wordId: number;
    word: string;
  }>;
  favoritesApi: {
    favorites: number[];
    toggle: (id: number) => void;
  };
  onRestart: () => void;
  data: VocabularyWord[];
}

const QuizCompletionScreen: React.FC<QuizCompletionScreenProps> = ({
  type,
  totalQuestions,
  correct,
  wrong,
  learning,
  wrongWords,
  correctWords = [],
  learningWords,
  favoritesApi,
  onRestart,
  data,
}) => {
  const [showWrongList, setShowWrongList] = useState(true);
  const [showCorrectList, setShowCorrectList] = useState(false);
  const [showLearningList, setShowLearningList] = useState(true);
  const [addedWrong, setAddedWrong] = useState(false);
  const [addedLearning, setAddedLearning] = useState(false);

  const correctRate =
    totalQuestions > 0
      ? Math.round((correct / totalQuestions) * 100 * 10) / 10
      : 0;

  const handleAddWrongToFavorites = () => {
    if (wrongWords.length === 0) return;
    wrongWords.forEach((w) => {
      if (w.wordId && !favoritesApi.favorites.includes(w.wordId)) {
        favoritesApi.toggle(w.wordId);
      }
    });
    setAddedWrong(true);
  };

  const handleAddLearningToFavorites = () => {
    if (learningWords.length === 0) return;
    learningWords.forEach((w) => {
      if (w.wordId && !favoritesApi.favorites.includes(w.wordId)) {
        favoritesApi.toggle(w.wordId);
      }
    });
    setAddedLearning(true);
  };

  return (
    <div className="text-center py-5 bg-white rounded-2xl shadow-xl border-t-4 border-indigo-600">
      <h2 className="text-2xl font-bold text-gray-800">
        {type === "flashcard" ? "閃卡複習完成！" : "測驗完成！"}
      </h2>

      {/* Score statistics */}
      {type === "flashcard" ? (
        <div className="flex items-center justify-center gap-6 mt-3 mb-6">
          <span className="text-gray-500">總張數：{totalQuestions} 張</span>
          <span className="text-gray-400">|</span>
          <span className="text-green-600 font-medium">
            你已學會：{correct} 個
          </span>
          {learning > 0 && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-orange-600 font-medium">
                還不熟：{learning} 個
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-6 mt-3 mb-6">
          <span className="text-gray-500">總題數：{totalQuestions} 題</span>
          <span className="text-gray-400">|</span>
          <span className="text-green-600 font-medium">
            正確：{correct}
            {correctRate > 0 && (
              <span className="text-gray-500 text-xs ml-1">
                ({correctRate}%)
              </span>
            )}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-rose-600 font-medium">
            錯誤：{wrong}
            {totalQuestions > 0 && (wrong / totalQuestions) * 100 > 0 && (
              <span className="text-gray-500 text-xs ml-1">
                ({Math.round((wrong / totalQuestions) * 100 * 10) / 10}%)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Wrong words list */}
      {wrongWords.length > 0 && (
        <div className="mb-6 text-left max-w-3xl mx-auto">
          <button
            onClick={() => setShowWrongList(!showWrongList)}
            className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition"
          >
            <span className="font-semibold text-red-700">
              {showWrongList ? "▼" : "▶"} 錯誤題目 ({wrongWords.length}題)
            </span>
          </button>
          {showWrongList && (
            <div className="mt-2 space-y-3">
              {wrongWords.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-lg border border-red-200"
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {idx + 1}.{" "}
                    {w.wordId && data ? (
                      <a
                        href={`#/word/${w.wordId}`}
                        onClick={() => {
                          const currentHash = window.location.hash || "#/quiz";
                          sessionStorage.setItem(
                            "quiz_return_path",
                            JSON.stringify({
                              path: currentHash,
                              timestamp: Date.now(),
                            }),
                          );
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        {w.word}
                      </a>
                    ) : (
                      w.word
                    )}
                    {(w.chinese_definition || w.wordId) && (
                      <span className="text-gray-500 font-normal ml-2">
                        ({w.chinese_definition})
                      </span>
                    )}
                  </div>
                  {w.question && (
                    <div className="flex items-start gap-2 mb-2">
                      <span className="shrink-0 font-medium text-gray-500">
                        題目：
                      </span>
                      <div className="flex-1">
                        <div className="text-gray-900 font-bold text-lg leading-relaxed">
                          {w.question}
                        </div>
                        {w.sentenceTranslation && (
                          <div className="text-sm text-gray-500 mt-0.5">
                            {w.sentenceTranslation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-medium text-green-600">
                        正確答案：
                      </span>
                      <div className="flex flex-col flex-1">
                        <span className="text-gray-900 font-bold text-lg">
                          {w.correctAnswer}
                        </span>
                        {w.chinese_definition && (
                          <span className="text-gray-500 text-sm">
                            {w.chinese_definition}
                          </span>
                        )}
                      </div>
                    </div>
                    {w.userAnswer && (
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 font-medium text-rose-600">
                          你的答案：
                        </span>
                        <div className="flex flex-col flex-1">
                          <span className="text-gray-900 font-bold text-lg">
                            {w.userAnswer}
                          </span>
                          {w.userAnswerDefinition && (
                            <span className="text-gray-500 text-sm">
                              {w.userAnswerDefinition}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Correct words list */}
      {correctWords.length > 0 && (
        <div className="mb-6 text-left max-w-3xl mx-auto">
          <button
            onClick={() => setShowCorrectList(!showCorrectList)}
            className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition"
          >
            <span className="font-semibold text-green-700">
              {showCorrectList ? "▼" : "▶"} 答對題目 ({correctWords.length}題)
            </span>
          </button>
          {showCorrectList && (
            <div className="mt-2 space-y-3">
              {correctWords.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-lg border border-green-200"
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {idx + 1}.{" "}
                    {w.wordId && data ? (
                      <a
                        href={`#/word/${w.wordId}`}
                        onClick={() => {
                          const currentHash = window.location.hash || "#/quiz";
                          sessionStorage.setItem(
                            "quiz_return_path",
                            JSON.stringify({
                              path: currentHash,
                              timestamp: Date.now(),
                            }),
                          );
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        {w.word}
                      </a>
                    ) : (
                      w.word
                    )}
                    {(w.chinese_definition || w.wordId) && (
                      <span className="text-gray-500 font-normal ml-2">
                        ({w.chinese_definition})
                      </span>
                    )}
                  </div>
                  {w.question && (
                    <div className="flex items-start gap-2 mb-2">
                      <span className="shrink-0 font-medium text-gray-500">
                        題目：
                      </span>
                      <div className="flex-1">
                        <div className="text-gray-900 font-bold text-lg leading-relaxed">
                          {w.question}
                        </div>
                        {w.sentenceTranslation && (
                          <div className="text-sm text-gray-500 mt-0.5">
                            {w.sentenceTranslation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 font-medium text-green-600">
                      正確答案：
                    </span>
                    <div className="flex flex-col flex-1">
                      <span className="text-gray-900 font-bold text-lg">
                        {w.correctAnswer}
                      </span>
                      {w.chinese_definition && (
                        <span className="text-gray-500 text-sm">
                          {w.chinese_definition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Learning words list (flashcard only) */}
      {learningWords.length > 0 && (
        <div className="mb-6 text-left max-w-3xl mx-auto">
          <button
            onClick={() => setShowLearningList(!showLearningList)}
            className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition"
          >
            <span className="font-semibold text-orange-700">
              {showLearningList ? "▼" : "▶"} 學習中單字 ({learningWords.length}
              題)
            </span>
          </button>
          {showLearningList && (
            <div className="mt-2 space-y-3">
              {learningWords.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-lg border border-orange-200"
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {idx + 1}. {w.word}
                  </div>
                  {w.wordId && data && (
                    <div className="mt-2">
                      <a
                        href={`#/word/${w.wordId}`}
                        onClick={() => {
                          const currentHash = window.location.hash || "#/quiz";
                          sessionStorage.setItem(
                            "quiz_return_path",
                            JSON.stringify({
                              path: currentHash,
                              timestamp: Date.now(),
                            }),
                          );
                        }}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        查看單字詳情 →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {wrongWords.length > 0 && (
          <div>
            <Button
              variant="primary"
              onClick={handleAddWrongToFavorites}
              disabled={addedWrong}
              className="mb-2"
            >
              {addedWrong
                ? `已加入 ${wrongWords.length} 個單字到重點訓練 ✓`
                : `將錯題加入重點訓練 (${wrongWords.length}個)`}
            </Button>
          </div>
        )}

        {learningWords.length > 0 && (
          <div>
            <Button
              variant="primary"
              onClick={handleAddLearningToFavorites}
              disabled={addedLearning}
              className="mb-2"
            >
              {addedLearning
                ? `已加入 ${learningWords.length} 個單字到重點訓練 ✓`
                : `將學習中的單字加入重點訓練 (${learningWords.length}個)`}
            </Button>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={onRestart}>
            重新開始測驗
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizCompletionScreen;
