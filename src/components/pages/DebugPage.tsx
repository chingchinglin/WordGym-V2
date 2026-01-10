/**
 * DebugPage - 顯示原始資料用於驗證 Google Sheets 更新
 * Issue #72: Debug tool for data verification
 */

import React, { useState } from "react";
import type { VocabularyWord } from "../../types";
import type { CacheInfo } from "../../hooks/useDataset";

interface DebugPageProps {
  words: VocabularyWord[];
  cacheInfo?: CacheInfo;
  onRefreshCache?: () => Promise<void>;
}

export const DebugPage: React.FC<DebugPageProps> = ({
  words,
  cacheInfo,
  onRefreshCache,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter words by search term
  const filteredWords = searchTerm
    ? words.filter(
        (w) =>
          w.english_word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.chinese_definition.includes(searchTerm),
      )
    : words.slice(0, 50); // Show first 50 by default

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefreshCache || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshCache();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format cache age
  const formatCacheAge = (ms?: number): string => {
    if (!ms) return "N/A";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  };

  // Stats by stage
  const juniorWords = words.filter((w) => w.stage === "junior");
  const seniorWords = words.filter((w) => w.stage === "senior");
  const unknownStage = words.filter((w) => !w.stage);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Debug: 資料檢查工具
      </h1>

      {/* Cache Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-blue-800 mb-2">快取狀態</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">來源:</span>{" "}
            <span className="font-mono">
              {cacheInfo?.fromCache ? "IndexedDB 快取" : "Google Sheets (即時)"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">快取時間:</span>{" "}
            <span className="font-mono">
              {formatCacheAge(cacheInfo?.cacheAge)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">狀態:</span>{" "}
            <span className="font-mono">
              {cacheInfo?.isLoading ? "載入中..." : "已載入"}
            </span>
          </div>
          <div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || cacheInfo?.isLoading}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isRefreshing ? "更新中..." : "強制刷新資料"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-green-800 mb-2">資料統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">總詞數:</span>{" "}
            <span className="font-mono font-bold">{words.length}</span>
          </div>
          <div>
            <span className="text-gray-600">國中 (junior):</span>{" "}
            <span className="font-mono">{juniorWords.length}</span>
          </div>
          <div>
            <span className="text-gray-600">高中 (senior):</span>{" "}
            <span className="font-mono">{seniorWords.length}</span>
          </div>
          <div>
            <span className="text-gray-600">無 stage:</span>{" "}
            <span className="font-mono text-red-600">
              {unknownStage.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜尋單字 (英文或中文)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          顯示 {filteredWords.length} 筆{" "}
          {searchTerm ? "(搜尋結果)" : "(前 50 筆)"}
        </p>
      </div>

      {/* Toggle raw JSON */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showRaw}
            onChange={(e) => setShowRaw(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">顯示完整 JSON</span>
        </label>
      </div>

      {/* Word List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">英文</th>
              <th className="px-3 py-2 text-left">中文</th>
              <th className="px-3 py-2 text-left">Stage</th>
              <th className="px-3 py-2 text-left">課本索引</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredWords.map((word) => (
              <tr key={word.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{word.id}</td>
                <td className="px-3 py-2 font-semibold">{word.english_word}</td>
                <td className="px-3 py-2">{word.chinese_definition}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      word.stage === "junior"
                        ? "bg-blue-100 text-blue-800"
                        : word.stage === "senior"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {word.stage || "無"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs font-mono">
                  {word.textbook_index
                    ?.map((t) => `${t.version}-${t.vol}-${t.lesson}`)
                    .join(", ") || "-"}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setSelectedWord(word)}
                    className="text-indigo-600 hover:underline text-xs"
                  >
                    查看 JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raw JSON display */}
      {showRaw && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">完整 JSON (前 10 筆)</h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs max-h-96">
            {JSON.stringify(words.slice(0, 10), null, 2)}
          </pre>
        </div>
      )}

      {/* Selected word modal */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">
                {selectedWord.english_word} 的完整資料
              </h3>
              <button
                onClick={() => setSelectedWord(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs whitespace-pre-wrap">
                {JSON.stringify(selectedWord, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
