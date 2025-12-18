# WordGym 專案重構 TODO

## 🔥 P0 - 立即處理（影響架構）

### 架構重構
- [ ] 初始化 Next.js 15 + TypeScript 專案
  - [ ] 安裝依賴：`npx create-next-app@latest wordgym-v2 --typescript --tailwind --app`
  - [ ] 遷移 Tailwind 配置
  - [ ] 設置專案結構（components/hooks/utils/types）

- [ ] 定義核心類型系統
  - [ ] `types/vocabulary.d.ts` - 單詞資料結構
  - [ ] `types/quiz.d.ts` - 測驗相關類型
  - [ ] `types/user.d.ts` - 用戶資料類型

- [ ] 拆分主要模組
  - [ ] 提取 Google Sheets 集成邏輯 → `utils/googleSheetsIntegration.ts`
  - [ ] 提取語音合成邏輯 → `utils/speechUtils.ts`
  - [ ] 提取 CSV 解析邏輯 → `utils/csvParser.ts`
  - [ ] 提取 localStorage 邏輯 → `utils/storage.ts`

### 元件化
- [ ] 核心元件拆分
  - [ ] `components/FlashCard.tsx` - 閃卡元件
  - [ ] `components/VocabList.tsx` - 單詞列表
  - [ ] `components/ThemeSelector.tsx` - 主題選擇器
  - [ ] `components/QuizInterface.tsx` - 測驗介面
  - [ ] `components/SpeakerButton.tsx` - 語音按鈕
  - [ ] `components/Button.tsx` - 基礎按鈕元件

- [ ] 建立 Custom Hooks
  - [ ] `hooks/useVocabulary.ts` - 單詞資料管理
  - [ ] `hooks/useHashRoute.ts` - 路由管理
  - [ ] `hooks/useSpeech.ts` - 語音合成
  - [ ] `hooks/useLocalStorage.ts` - localStorage 封裝

### 開發工具鏈
- [ ] 配置 ESLint
  - [ ] 安裝：`eslint-config-next`
  - [ ] 設定規則（`.eslintrc.json`）
  - [ ] 修復現有警告

- [ ] 配置 Prettier
  - [ ] 創建 `.prettierrc`
  - [ ] 設定 format on save
  - [ ] 整理所有代碼格式

- [ ] 設置 Git Hooks
  - [ ] 安裝 Husky：`npx husky-init`
  - [ ] Pre-commit: ESLint + Prettier
  - [ ] Pre-push: 類型檢查

---

## ⚠️ P1 - 近期完成（提升品質）

### 狀態管理
- [ ] 選擇狀態管理方案（推薦 Zustand）
- [ ] 建立 stores
  - [ ] `stores/vocabularyStore.ts` - 單詞資料
  - [ ] `stores/userStore.ts` - 用戶設定
  - [ ] `stores/quizStore.ts` - 測驗狀態

### 測試
- [ ] 設置測試環境
  - [ ] 安裝 Jest + React Testing Library
  - [ ] 配置 `jest.config.js`
  - [ ] 設置測試覆蓋率目標（70%）

- [ ] 單元測試（核心邏輯）
  - [ ] `utils/csvParser.test.ts`
  - [ ] `utils/speechUtils.test.ts`
  - [ ] `hooks/useVocabulary.test.ts`

- [ ] 元件測試
  - [ ] `FlashCard.test.tsx`
  - [ ] `VocabList.test.tsx`
  - [ ] `QuizInterface.test.tsx`

- [ ] E2E 測試（關鍵流程）
  - [ ] 安裝 Playwright
  - [ ] 測試：單詞瀏覽流程
  - [ ] 測試：測驗完整流程
  - [ ] 測試：Google Sheets 匯入

### CI/CD
- [ ] GitHub Actions 設置
  - [ ] `.github/workflows/test.yml` - 自動測試
  - [ ] `.github/workflows/deploy.yml` - 自動部署
  - [ ] 設定測試覆蓋率報告

- [ ] 部署環境
  - [ ] Vercel 部署配置
  - [ ] 環境變數管理
  - [ ] 預覽環境設置

---

## ℹ️ P2 - 優化改進（長期目標）

### 性能優化
- [ ] React 性能優化
  - [ ] 識別渲染瓶頸（React DevTools Profiler）
  - [ ] 加入 `React.memo` 到高頻渲染元件
  - [ ] 使用 `useMemo`/`useCallback` 優化重計算

- [ ] 代碼分割
  - [ ] 按路由分割（Next.js 自動）
  - [ ] 動態匯入大型元件
  - [ ] 圖片/資源優化

### 文檔
- [ ] 專案文檔
  - [ ] 更新 `README.md` - 專案說明
  - [ ] `CONTRIBUTING.md` - 貢獻指南
  - [ ] `ARCHITECTURE.md` - 架構文檔
  - [ ] API 文檔（如需要）

- [ ] 代碼文檔
  - [ ] 核心函數加上 JSDoc
  - [ ] 複雜邏輯加註解
  - [ ] 元件 Props 文檔

### 版本管理清理
- [ ] 整理歷史版本
  - [ ] 歸檔舊版本到 `/archive` 資料夾
  - [ ] 建立版本對照表
  - [ ] 清理不必要的重複文件

---

## 📋 資料遷移

### 資料處理
- [ ] 驗證現有資料完整性
  - [ ] 檢查 Google Sheets 資料格式
  - [ ] 驗證 localStorage 資料結構
  - [ ] 備份現有用戶資料

- [ ] 資料遷移腳本
  - [ ] 舊格式 → 新格式轉換
  - [ ] 測試遷移流程
  - [ ] 提供回滾機制

---

## 🧪 測試清單（上線前）

- [ ] 功能測試
  - [ ] ✅ 單詞瀏覽
  - [ ] ✅ 閃卡翻轉
  - [ ] ✅ 語音朗讀
  - [ ] ✅ 測驗功能
  - [ ] ✅ 最愛收藏
  - [ ] ✅ Google Sheets 匯入

- [ ] 跨瀏覽器測試
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Mobile Safari
  - [ ] Mobile Chrome

- [ ] 效能測試
  - [ ] Lighthouse 評分 > 90
  - [ ] 首次內容繪製 < 1.5s
  - [ ] 互動時間 < 3s

---

## 🎯 里程碑

| 階段 | 目標 | 預估時間 | 狀態 |
|------|------|----------|------|
| Phase 1 | 完成架構遷移 | 2 週 | ⏳ 進行中 |
| Phase 2 | 測試 + CI/CD | 1 週 | ⬜ 待開始 |
| Phase 3 | 優化 + 部署 | 1 週 | ⬜ 待開始 |

---

**最後更新**：2025-12-18
**負責人**：Young
**專案狀態**：🚧 重構進行中
