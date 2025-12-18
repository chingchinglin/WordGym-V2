import { useEffect, useState } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import { HomePage } from './components/pages/HomePage';
import { FavoritesPage } from './components/pages/FavoritesPage';
import { QuizPage } from './components/pages/QuizPage';
import { QuizHistoryPage } from './components/pages/QuizHistoryPage';
import { MultipleChoiceQuiz } from './components/quiz/MultipleChoiceQuiz';
import { FlashcardQuiz } from './components/quiz/FlashcardQuiz';
import { useDataset } from './hooks/useDataset';
import { loadAllGoogleSheets } from './services/googleSheetLoader';
import { GOOGLE_SHEET_CONFIG, PRESET_VERSION } from './config/googleSheet';

function App() {
  const { hash, push } = useHashRoute();
  const { data, importRows, markPresetApplied } = useDataset();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Auto-load Google Sheets on mount if no data exists
  useEffect(() => {
    let cancelled = false;

    const autoLoad = async () => {
      console.log('=== 自動載入檢查 ===');
      console.log('目前資料數量:', data.length);
      console.log('Google Sheets 啟用:', GOOGLE_SHEET_CONFIG.enabled);
      console.log('PRESET_VERSION:', PRESET_VERSION);

      // Check localStorage version
      const storedVersion = localStorage.getItem('mvp_vocab_preset_applied_v36');
      console.log('localStorage 版本:', storedVersion);

      if (data.length > 0) {
        console.log('已有資料，跳過載入');
        return;
      }

      if (!GOOGLE_SHEET_CONFIG.enabled) {
        console.log('Google Sheets 未啟用');
        return;
      }

      console.log('開始載入 Google Sheets...');
      setIsLoading(true);
      setLoadError(null);

      try {
        const results = await loadAllGoogleSheets();
        console.log('載入結果:', results);

        if (cancelled) {
          console.log('已取消載入');
          return;
        }

        let isFirstSheet = true;
        for (const { rows, theme } of results) {
          console.log(`匯入 ${rows.length} 筆資料，主題:`, theme);
          if (rows.length > 0 && !cancelled) {
            // Import with replace: true on first sheet, false on subsequent
            const opts = isFirstSheet
              ? { overrideExamples: false, replace: true }
              : { overrideExamples: false, replace: false };
            const stats = importRows(rows, opts);
            console.log('匯入統計:', stats);
            isFirstSheet = false;
          }
        }

        if (!cancelled) {
          // Mark preset as successfully applied
          markPresetApplied();
          console.log('✅ Google Sheets 載入完成，總資料數:', data.length);
        }
      } catch (error) {
        console.error('載入 Google Sheets 失敗:', error);
        setLoadError(`載入資料失敗: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    autoLoad();

    return () => {
      cancelled = true;
    };
  }, []); // Run only once on mount

  const goToHome = () => push('#/');
  const goToAbout = () => push('#/about');
  const goToFavorites = () => push('#/favorites');
  const goToQuiz = () => push('#/quiz');
  const goToQuizHistory = () => push('#/quiz-history');

  const renderContent = () => {
    switch (hash) {
      case '#/':
        return <HomePage />;
      case '#/about':
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              關於 WordGym
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                WordGym 單字健身坊是一個現代化的單字學習平台，專為學生設計。
              </p>
              <p>
                本專案採用最新的前端技術，提供流暢的學習體驗，並能打包成單一 HTML 檔案，
                方便部署和分享。
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">核心功能</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>語音朗讀單字與例句</li>
                  <li>詞性與主題分類</li>
                  <li>學習進度追蹤</li>
                  <li>響應式設計，支援各種裝置</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case '#/favorites':
        return <FavoritesPage />;
      case '#/quiz':
        return <QuizPage />;
      case '#/quiz-history':
        return <QuizHistoryPage />;
      case '#/multiple-choice-quiz':
        return <MultipleChoiceQuiz words={data.slice(0, 10)} />;
      case '#/flashcard-quiz':
        return <FlashcardQuiz words={data.slice(0, 10)} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">
          WordGym 單字健身坊
        </h1>
        <p className="text-xl text-gray-600">學生版</p>
      </header>

      {/* Loading Status */}
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">⏳ 正在從 Google Sheets 載入資料...</p>
        </div>
      )}

      {/* Error Message */}
      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">❌ {loadError}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="mb-8 flex gap-4 flex-wrap">
        {[
          { label: '首頁', route: '#/', action: goToHome },
          { label: '關於', route: '#/about', action: goToAbout },
          { label: '收藏單字', route: '#/favorites', action: goToFavorites },
          { label: '測驗', route: '#/quiz', action: goToQuiz },
          { label: '測驗紀錄', route: '#/quiz-history', action: goToQuizHistory }
        ].map(({ label, route, action }) => (
          <button
            key={route}
            onClick={action}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hash === route
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="bg-white rounded-lg shadow-lg p-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        WordGym Students v2.0.0 | Built with React + Vite + TypeScript
      </footer>
    </div>
  );
}

export default App;