import { useHashRoute } from './hooks/useHashRoute';
import { speak, stopSpeech } from './utils/speechUtils';

function App() {
  const { hash, push } = useHashRoute();

  const handleSpeak = () => {
    speak('Hello from WordGym! Welcome to the vocabulary training app.');
  };

  const handleStopSpeak = () => {
    stopSpeech();
  };

  const goToHome = () => push('#/');
  const goToAbout = () => push('#/about');

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">
          WordGym 單字健身坊
        </h1>
        <p className="text-xl text-gray-600">學生版</p>
      </header>

      {/* Navigation */}
      <nav className="mb-8 flex gap-4">
        <button
          onClick={goToHome}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            hash === '#/' || hash === ''
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          首頁
        </button>
        <button
          onClick={goToAbout}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            hash === '#/about'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          關於
        </button>
      </nav>

      {/* Main Content */}
      <main className="bg-white rounded-lg shadow-lg p-8">
        {(hash === '#/' || hash === '') && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              專案重構完成！
            </h2>

            <div className="space-y-4">
              <p className="text-gray-700">
                當前路由：<code className="bg-gray-100 px-2 py-1 rounded">{hash}</code>
              </p>

              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">技術架構</h3>
                <ul className="text-indigo-800 space-y-1 list-disc list-inside">
                  <li>React 18 + TypeScript</li>
                  <li>Vite 5 (快速開發與打包)</li>
                  <li>Tailwind CSS (樣式框架)</li>
                  <li>單一檔案輸出 (vite-plugin-singlefile)</li>
                  <li>Hash-based routing (無需後端)</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSpeak}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
                >
                  測試語音 🔊
                </button>
                <button
                  onClick={handleStopSpeak}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
                >
                  停止語音 ⏹️
                </button>
              </div>
            </div>
          </div>
        )}

        {hash === '#/about' && (
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
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        WordGym Students v1.0.0 | Built with React + Vite + TypeScript
      </footer>
    </div>
  );
}

export default App;
