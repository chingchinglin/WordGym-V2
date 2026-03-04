# WordGym-students-merge
國高中英文單字學習網站

<!-- Auto-deploy trigger -->

## 功能介紹

- 單字卡瀏覽：依課本冊次/課次、主題分類篩選單字
- 實力驗收：選擇題測驗（AI 即時生成干擾選項）與閃卡複習
- 重點訓練：將不熟的單字加入收藏，集中複習
- 匯出錯題筆記：測驗完成後可將答錯的單字下載為 CSV（含英文單字、中文定義、題目例句、例句翻譯、我的答案）

## 部署方式

### 自動部署

每次 push 到 main 分支會自動觸發：

| 部署目標 | 狀態 | 說明 |
|----------|------|------|
| GitHub Pages | ✅ 自動 | https://youngger9765.github.io/WordGym-students-merge/ |
| GitHub Release | ✅ 自動 | 每次 push 更新 `latest` release |
| dist 分支 | ✅ 自動 | 最新 build 檔案 |
| GCS Bucket | ⏳ 需設定 | 需設定 `GCS_SA_KEY` secret |

### 本地部署到 GCS（推薦）

使用部署腳本可以自動處理版本控制和快取問題：

```bash
# 設定環境變數
export GCS_BUCKET=your-bucket-name
export GCS_SA_KEY=/path/to/service-account-key.json
export GCS_PATH=event/wordgym  # 可選

# 執行部署
npm run deploy:gcs
```

**部署腳本會自動：**
- ✅ 建置專案
- ✅ **為 CSS/JS 添加版本參數**（避免快取問題）
- ✅ 上傳到 GCS
- ✅ 設定 Cache-Control
- ✅ 設定公開讀取權限

詳細說明請參考 [GCS 部署指南](docs/DEPLOY_GCS.md)

### 手動部署到 GCS

#### Step 1: 下載 dist 檔案

**方式 A - Release 下載 (推薦)**
1. 到 [Releases 頁面](https://github.com/Youngger9765/WordGym-students-merge/releases/tag/latest)
2. 下載 `wordgym-dist.zip`
3. 解壓縮

**方式 B - dist 分支下載**
1. 到 [dist 分支](https://github.com/Youngger9765/WordGym-students-merge/tree/dist)
2. 點 Code → Download ZIP
3. 解壓縮

#### Step 2: 上傳到 GCS

1. 開啟 [GCS Console](https://console.cloud.google.com/storage/browser)
2. 進入 bucket: `jutor-event-di1dzdgl64`
3. 進入路徑: `event/wordgym/`
4. 上傳解壓後的檔案 (index.html + images/)

**注意**：手動上傳不會自動添加版本參數，可能會有快取問題。建議使用部署腳本。

---

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

The built file will be in `dist/index.html` as a single self-contained HTML file.

## Opening the Built File

### Option 1: Double-click (Direct file:// access)
You can directly open `dist/index.html` in your browser. The app automatically detects file:// protocol and uses a CORS proxy (allorigins.win) to load Google Sheets data.

**Note**: First load may be slower due to CORS proxy. Subsequent loads use cached data from localStorage.

### Option 2: Local HTTP Server (Recommended)
For better performance and no CORS proxy dependency:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server dist -p 8000

# Using Vite preview
npm run preview
```

Then open `http://localhost:8000` in your browser.

## Google Sheets Integration

### How it Works
- The app loads vocabulary data from Google Sheets on first launch
- Data is cached in localStorage for offline use
- File protocol: Uses JSONP via CORS proxy (allorigins.win)
- HTTP protocol: Direct fetch (faster, no proxy needed)

### CORS Solution
The original `index.html` and the built TypeScript version both face the same limitation: browsers block `fetch()` requests from `file://` protocol due to security restrictions.

**Solution implemented:**
1. Detect if running from `file://` protocol
2. If yes: Use JSONP with CORS proxy (allorigins.win)
3. If no: Use direct fetch (normal behavior)

See `/Users/young/project/WordGym-students-merge/src/services/googleSheetLoader.ts` for implementation details.

### Configuration
Edit `/Users/young/project/WordGym-students-merge/src/config/googleSheet.ts` to change:
- Google Sheet ID
- Sheet tabs (gid)
- Enable/disable auto-loading

## Project Structure

```
src/
├── components/      # React components
├── config/         # Configuration files
├── hooks/          # Custom React hooks
├── services/       # Business logic (Google Sheets loader, etc.)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── main.tsx        # Application entry point
└── App.tsx         # Root React component

index.html          # Vite entry point (loads src/main.tsx)
dist/
└── index.html      # Single-file production build

Old files (archived):
├── index-standalone-old.html  # Original single-file HTML (pre-TypeScript)
├── index-new.html             # (if exists)
└── index-old.html             # (if exists)
```

## Technical Notes

### TypeScript Migration
The project has been migrated from a single-file HTML/JavaScript application to a modern TypeScript/React/Vite stack while maintaining the single-file deployment capability.

### CORS Fix Implementation
The Google Sheets loader automatically detects the protocol and chooses the appropriate loading method:
- **file:// protocol**: Uses JSONP with allorigins.win CORS proxy
- **http(s):// protocol**: Uses direct fetch (Google Sheets has CORS headers)

This enables the built `dist/index.html` to work both when:
1. Double-clicked (opens as file://)
2. Served via any HTTP server

### Build Process
1. TypeScript compilation (tsc)
2. Vite bundling with React
3. Single-file plugin combines all assets into one HTML file
4. Result: Self-contained 194KB HTML file with all JavaScript, CSS, and assets inlined
<!-- Last updated: 2025年12月20日 週六 15時07分53秒 CST -->
