import { useEffect, useState } from "react";
import { useHashRoute } from "./hooks/useHashRoute";
import { HomePage } from "./components/pages/HomePage";
import { FavoritesPage } from "./components/pages/FavoritesPage";
import { QuizPage } from "./components/pages/QuizPage";
import QuizHistoryPage from "./components/pages/QuizHistoryPage";
import { WordDetailPage } from "./components/pages/WordDetailPage";
import { DebugPage } from "./components/pages/DebugPage";
import { Shell } from "./components/layout/Shell";
import { WelcomeModal } from "./components/modals/WelcomeModal";
import { useDataset } from "./hooks/useDataset";
import { useUserSettings } from "./hooks/useUserSettings";
import { VersionService } from "./services/VersionService";
import { TTS_LOADING_EVENT } from "./lib/jutor-tts";
import type { UserSettings } from "./types";
import { parseLabel } from "./utils/labelParser";

// ── ?label= 預處理（React 渲染前同步執行）──
(function applyLabelParam() {
  const params = new URLSearchParams(window.location.search);
  const label = params.get("label");
  if (!label) return;

  const info = parseLabel(label);
  if (!info) return;

  // 1. 寫入 userSettings → localStorage（持久）
  localStorage.setItem(
    "wordgym_user_settings_v1",
    JSON.stringify({ stage: info.stage, version: info.version }),
  );

  // 2. 寫入 label filter → sessionStorage（僅本次）
  sessionStorage.setItem(
    "wordgym_label_filter",
    JSON.stringify({ vol: info.vol, lesson: info.lesson }),
  );

  // 3. 確保 hash 指向首頁
  if (!window.location.hash || window.location.hash === "#") {
    window.location.hash = "#/";
  }
})();

function App() {
  const { hash } = useHashRoute();
  const { data, cacheInfo, refreshCache } = useDataset();
  const { userSettings, setUserSettings } = useUserSettings();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  // Removed unused state

  // Debug: Track data changes
  useEffect(() => {
    // Removed logging;
    if (data.length > 0) {
      // Removed logging.map(w => ({ id: w.id, type: typeof w.id, word: w.english_word })));
    }
  }, [data.length]);

  // Show welcome/version modal based on settings
  useEffect(() => {
    if (!userSettings && data.length > 0) {
      setShowWelcome(true);
    } else if (userSettings) {
      // Close welcome modal
      setShowWelcome(false);

      // Check version selection
      const stage =
        userSettings.stage === "junior"
          ? "junior"
          : userSettings.stage === "senior"
            ? "high"
            : undefined;

      const isValidVersion = stage
        ? VersionService.isValidSelection(userSettings.version, stage)
        : false;

      // Show version selection if no valid version
      setShowVersionModal(!isValidVersion);
    }
  }, [userSettings, data.length]);

  // 監聽 TTS 載入事件，顯示全螢幕 Loading Overlay
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ loading: boolean }>).detail;
      if (typeof detail?.loading === "boolean") {
        setIsTtsLoading(detail.loading);
      }
    };
    window.addEventListener(TTS_LOADING_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(TTS_LOADING_EVENT, handler as EventListener);
    };
  }, []);

  // Get current route for Shell
  const getRoute = () => {
    const [basePath] = hash.split("?");
    if (basePath.startsWith("#/quiz")) return "quiz";
    if (basePath.startsWith("#/favorites")) return "favorites";
    if (basePath.startsWith("#/word/")) return "word";
    return "home";
  };

  const renderContent = () => {
    // Extract base path and query params from hash
    const [basePath] = hash.split("?");

    // Word detail page
    if (basePath.startsWith("#/word/")) {
      const param = basePath.replace("#/word/", "");
      // Try to parse as ID first, otherwise treat as word text
      const wordId = parseInt(param);
      let word: (typeof data)[0] | undefined;

      if (!isNaN(wordId)) {
        word = data.find((w) => w.id === wordId);
      } else {
        // Try to find by english_word text (for synonym/antonym links)
        const wordText = decodeURIComponent(param);
        word = data.find(
          (w) => w.english_word.toLowerCase() === wordText.toLowerCase(),
        );
      }

      if (!word) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">找不到該單字</p>
            <button
              onClick={() => (window.location.hash = "#/")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              返回首頁
            </button>
          </div>
        );
      }
      return <WordDetailPage word={word} userSettings={userSettings} />;
    }

    switch (basePath) {
      case "#/":
      case "":
        return <HomePage words={data} userSettings={userSettings} cacheInfo={cacheInfo} />;
      case "#/favorites":
        return <FavoritesPage words={data} />;
      case "#/quiz":
        return <QuizPage words={data} userSettings={userSettings} />;
      case "#/quiz-history":
        return <QuizHistoryPage />;
      case "#/debug":
        return (
          <DebugPage
            words={data}
            cacheInfo={cacheInfo}
            onRefreshCache={refreshCache}
          />
        );
      default:
        return <HomePage words={data} userSettings={userSettings} cacheInfo={cacheInfo} />;
    }
  };

  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          setUserSettings={setUserSettings as (settings: UserSettings) => void}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* Version Selection Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-xl max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              請選擇課本版本
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              請在開始使用前選擇您的課本版本。這將幫助我們為您客製化學習內容。
            </p>
            <WelcomeModal
              setUserSettings={
                setUserSettings as (settings: UserSettings) => void
              }
              onClose={() => {
                const stage =
                  userSettings?.stage === "junior"
                    ? "junior"
                    : userSettings?.stage === "senior"
                      ? "high"
                      : undefined;

                if (
                  VersionService.isValidSelection(userSettings?.version, stage)
                ) {
                  setShowVersionModal(false);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Main App */}
      <Shell
        route={getRoute()}
        userSettings={userSettings}
        onUserSettingsChange={(settings) => {
          if (settings) {
            setUserSettings(settings);
            setShowWelcome(false);
          } else {
            setShowWelcome(true);
          }
        }}
        cacheInfo={cacheInfo}
        onRefreshCache={refreshCache}
      >
        {/* Block content if no version selected */}
        {!showVersionModal && renderContent()}
      </Shell>

      {/* TTS Loading Overlay */}
      {isTtsLoading && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin" aria-label="語音生成中" />
            <div className="text-sm font-medium">語音生成中，請稍候…</div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
