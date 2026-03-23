# GCS 部署歷史記錄

## 📅 按時間順序排列（從遠到近）

### 1. 2025-12-19 - GitHub Pages 部署設定
- **類型**: GitHub Pages 自動部署
- **路徑**: GitHub Pages
- **說明**: 設定 GitHub Actions 自動部署到 GitHub Pages
- **相關文件**: Git commit history
- **狀態**: ✅ 完成

---

### 2. 2025-12-20 - 專案規劃與重構計劃
- **類型**: 文件建立
- **路徑**: N/A
- **說明**: 建立 PRD 和重構計劃文件
- **相關文件**: 
  - `PRD.md` (最後更新: 2025-12-20)
  - `REFACTORING-PLAN.md` (建立日期: 2025-12-20)
- **狀態**: ✅ 完成

---

### 3. 2026-01-06 - GCS 部署工作流程建立
- **類型**: GCS 部署腳本建立
- **路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`
- **說明**: 添加 GCS 部署工作流程和部署腳本
- **相關文件**: 
  - `scripts/deploy-gcs.mjs`
  - `scripts/deploy-gcs.sh`
  - `docs/DEPLOY_GCS.md`
- **Bucket**: `jutor-event-di1dzdgl64`
- **部署路徑**: `event/wordgym`
- **狀態**: ✅ 完成

---

### 4. 2026-01-16 - GCS 部署成功
- **類型**: GCS 實際部署
- **路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`
- **說明**: 成功部署到 GCS，包含三民資料更新和例句音檔功能
- **相關文件**: `DEPLOYMENT_SUCCESS.md`
- **Bucket**: `jutor-event-di1dzdgl64`
- **部署路徑**: `event/wordgym`
- **完整 GCS 路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`
- **公開訪問 URL**: `https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html`
- **部署內容**:
  - `index.html` (8.77 MB)
  - `images/favorites-girl.png`
  - `images/favorites-girl.webp`
  - `images/quiz-boy.png`
  - `images/quiz-boy.webp`
- **更新內容**:
  - 三民資料更新（1,898 個單字）
  - 例句音檔功能
  - 總單字數：11,889 筆
- **狀態**: ✅ 完成

---

### 5. 2026-01-21 - 部署架構文件更新
- **類型**: 文件更新
- **路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`
- **說明**: 更新部署架構說明文件，說明 CORS 設定和反向代理架構
- **相關文件**: 
  - `DEPLOYMENT_ARCHITECTURE.md` (最後更新: 2025-01-21)
  - `AZURE_TTS_INTEGRATION_PLAN.md` (最後更新: 2025-01-21)
- **Bucket**: `jutor-event-di1dzdgl64`
- **部署路徑**: `event/wordgym`
- **重點說明**:
  - 使用者訪問 URL: `https://jutor.ai/event/wordgym/index.html`
  - 實際檔案位置: `https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html`
  - CORS 白名單說明（不需要加入 `storage.googleapis.com`）
- **狀態**: ✅ 完成

---

### 6. 2026-02-06 - 閃卡詞性 + 自訂題數功能
- **類型**: GCS 實際部署
- **路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`
- **說明**: 部署閃卡顯示詞性、例句字體放大、自訂測驗題數功能
- **Bucket**: `jutor-event-di1dzdgl64`
- **部署路徑**: `event/wordgym`
- **公開訪問 URL**: `https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html`
- **反向代理 URL**: `https://jutor.ai/event/wordgym/index.html`
- **更新內容**:
  - FlashcardQuiz: 正面/背面顯示詞性標註 (n., v., adj. 等)
  - FlashcardQuiz: 例句字體放大 (text-lg md:text-2xl)
  - QuizPage: 超過20題時可自訂測驗題數（最少5題）
  - QuizPage: 使用 Fisher-Yates 隨機抽取指定數量的題目
- **Git Commit**: `af8afac`
- **狀態**: ✅ 完成

---

## 📊 總結

所有部署記錄都使用相同的 GCS 路徑：
- **Bucket**: `jutor-event-di1dzdgl64`
- **部署路徑**: `event/wordgym`
- **完整 GCS 路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`

## 🔄 下次部署

下次部署時，只需執行：
```bash
GCS_BUCKET=jutor-event-di1dzdgl64 GCS_PATH=event/wordgym npm run deploy:gcs
```

或分開設定環境變數：
```bash
export GCS_BUCKET=jutor-event-di1dzdgl64
export GCS_PATH=event/wordgym
npm run deploy:gcs
```
