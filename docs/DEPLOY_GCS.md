# GCS 本地部署指南

本專案提供純本地部署工具，可直接從本地端部署到 Google Cloud Storage (GCS)，不依賴 GitHub Actions。

---

## ⚠️ 重要規則：部署前必須經過案主確認

**絕對禁止未經確認就部署到 GCS！**

### 部署流程（必須遵守）

```
1. 修改程式碼
   ↓
2. npm run build（確認編譯通過）
   ↓
3. npm run preview（本地測試）
   ↓
4. 【案主在本地端測試確認通過】← 必須！
   ↓
5. 案主明確說「部署」或「上線」
   ↓
6. 才能執行 npm run deploy:gcs
```

### 禁止事項

- ❌ 修改後直接部署
- ❌ 案主沒說「部署」就自己部署
- ❌ 跳過本地測試直接部署

### 正確做法

- ✅ 修改後先 build + preview
- ✅ 提供本地測試網址（http://localhost:4173）
- ✅ 等待案主測試確認
- ✅ 案主說「部署」後才執行部署

---

## 本地部署

### 方式一：使用 Node.js 腳本（推薦）

#### 前置需求

- Node.js
- Google Cloud SDK (`gcloud` 和 `gsutil`)

#### 最簡單的使用方式（推薦 - 使用現有 gcloud 認證）

如果你已經使用 `gcloud auth login` 認證，只需要設定 bucket 和路徑：

```bash
# 設定環境變數
export GCS_BUCKET=your-bucket-name
export GCS_PATH=event/wordgym  # 可選，預設為 event/wordgym

# 執行部署
npm run deploy:gcs
```

腳本會自動檢測並使用現有的 gcloud 認證。

#### 使用 Service Account Key

如果需要使用 Service Account Key：

```bash
# 設定環境變數
export GCS_BUCKET=your-bucket-name
export GCS_PATH=event/wordgym  # 可選
export GCS_SA_KEY=/path/to/service-account-key.json

# 執行部署
npm run deploy:gcs
```

#### 使用配置檔案

1. **複製配置範本**
   ```bash
   cp .gcs-deploy.config.json.example .gcs-deploy.config.json
   ```

2. **編輯配置檔案**
   
   編輯 `.gcs-deploy.config.json`，填入：
   - `bucket`: GCS bucket 名稱
   - `path`: 部署路徑
   - `credentials`: Service Account Key JSON 內容

3. **執行部署**
   ```bash
   npm run deploy:gcs
   ```

#### 使用環境變數 GCS_CREDENTIALS（完整 JSON）

```bash
export GCS_CREDENTIALS='{"bucket":"your-bucket","path":"event/wordgym","credentials":{...}}'
npm run deploy:gcs
```

### 方式二：使用 Shell 腳本

#### 前置需求

- Google Cloud SDK (`gcloud` 和 `gsutil`)
- Bash

#### 設定步驟

1. **設定必要環境變數**
   ```bash
   export GCS_BUCKET="your-bucket-name"  # 必填
   export GCS_SA_KEY="/path/to/service-account-key.json"  # 必填
   export GCS_PATH="event/wordgym"  # 可選，預設為 event/wordgym
   ```

2. **執行部署**
   ```bash
   bash scripts/deploy-gcs.sh
   ```

   或賦予執行權限後直接執行：
   ```bash
   chmod +x scripts/deploy-gcs.sh
   ./scripts/deploy-gcs.sh
   ```

## 部署流程

兩種腳本都會執行以下步驟：

1. ✅ 檢查必要工具（gsutil, gcloud）
2. ✅ 設定 Google Cloud 認證
3. ✅ 建置專案（`npm run build`）
4. ✅ 檢查 dist 目錄
5. ✅ **自動為 CSS/JS 添加版本參數**（避免快取問題）
6. ✅ 上傳檔案到 GCS
7. ✅ 設定 Cache-Control（HTML 不快取，Assets 快取 1 天）
8. ✅ 設定公開讀取權限

## 版本控制功能

部署腳本會自動為 HTML 中的 CSS 和 JavaScript 檔案引用添加唯一版本參數，避免瀏覽器快取問題。

### 工作原理

1. **掃描資源檔案**：自動掃描 `dist` 目錄中的所有 `.css` 和 `.js` 檔案
2. **生成版本號**：為每個檔案生成唯一版本號（使用檔案修改時間 + 內容 MD5 hash）
3. **更新 HTML**：在 HTML 中為所有 CSS/JS 引用添加 `?v=版本號` 參數

### 範例

**處理前：**
```html
<link rel="stylesheet" href="assets/style.css">
<script src="assets/app.js"></script>
```

**處理後：**
```html
<link rel="stylesheet" href="assets/style.css?v=1703123456-a1b2c3d4">
<script src="assets/app.js?v=1703123456-e5f6g7h8"></script>
```

### 版本號格式

版本號格式：`{timestamp}-{hash}`
- `timestamp`：檔案最後修改時間（秒）
- `hash`：檔案內容的 MD5 hash 前 8 位

這樣確保：
- 檔案內容改變時，版本號會改變
- 檔案修改時間改變時，版本號也會改變
- 瀏覽器會將新版本視為不同的資源，強制重新下載

### 注意事項

- 如果專案使用 `vite-plugin-singlefile` 將所有資源內嵌到 HTML，可能不會有外部 CSS/JS 檔案，此時版本控制會自動跳過
- 版本控制只處理外部引用的檔案，內嵌在 HTML 中的 `<style>` 和 `<script>` 標籤不受影響

## 配置說明

### Cache-Control 設定

- **HTML 檔案**: `no-cache, no-store, must-revalidate` - 確保總是載入最新版本
- **Assets 檔案**: `public, max-age=86400` - 快取 1 天以提升效能

### 部署路徑

預設部署路徑為 `gs://{bucket}/event/wordgym/`，可在配置檔案或環境變數中修改。

## 故障排除

### 認證失敗

- 確認 Service Account Key 檔案路徑正確
- 確認 Service Account 有 bucket 的寫入權限
- 確認 Key 未過期

### 上傳失敗

- 確認 bucket 名稱正確
- 確認網路連線正常
- 檢查 bucket 權限設定

### 權限錯誤

如果遇到權限錯誤，確認 Service Account 有以下權限：
- `storage.objects.create`
- `storage.objects.delete`
- `storage.objects.get`
- `storage.objects.list`
- `storage.buckets.get`

## 相關檔案

- `scripts/deploy-gcs.mjs` - Node.js 本地部署腳本
- `scripts/deploy-gcs.sh` - Shell 本地部署腳本
- `.gcs-deploy.config.json.example` - 配置檔案範本（可選）

## 快速開始範例

### 範例 1：使用現有 gcloud 認證（最簡單）

```bash
# 確保已登入 gcloud
gcloud auth login

# 設定環境變數
export GCS_BUCKET=my-wordgym-bucket
export GCS_PATH=event/wordgym

# 執行部署
npm run deploy:gcs
```

### 範例 2：使用 Service Account Key

```bash
# 下載 Service Account Key 到專案目錄
# 然後設定環境變數
export GCS_BUCKET=my-wordgym-bucket
export GCS_SA_KEY=./service-account-key.json
export GCS_PATH=event/wordgym

# 執行部署
npm run deploy:gcs
```

### 範例 3：一次性部署（不設定環境變數）

```bash
# 使用現有認證
GCS_BUCKET=my-bucket GCS_PATH=event/wordgym npm run deploy:gcs

# 或使用 Service Account
GCS_BUCKET=my-bucket GCS_SA_KEY=./key.json npm run deploy:gcs
```
