# GCS 部署執行計劃

## 📋 環境檢查結果

### ✅ 已確認項目

1. **Google Cloud SDK 狀態**
   - ✅ gcloud 已安裝（版本 552.0.0）
   - ✅ gsutil 已安裝（版本 5.35）

2. **認證狀態**
   - ✅ 已認證帳號：`ching.lin@junyiacademy.org`
   - ✅ 帳號狀態：ACTIVE

3. **Bucket 存取權限**
   - ✅ 可以存取 bucket：`jutor-event-di1dzdgl64`
   - ✅ 可以存取路徑：`gs://jutor-event-di1dzdgl64/event/`
   - ℹ️ 目標路徑 `event/wordgym/` 目前不存在（將在部署時創建）

4. **專案建置狀態**
   - ✅ 專案可以成功建置
   - ✅ dist 目錄包含：
     - `index.html` (4.37 MB)
     - `images/` 目錄（包含圖片資源）

## 🎯 部署目標

- **Bucket**: `jutor-event-di1dzdgl64`
- **部署路徑**: `event/wordgym/`
- **完整 GCS 路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`
- **公開訪問 URL**: `https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html`

## 📝 部署計劃步驟

### 階段 1：準備工作

#### 步驟 1.1：確認建置檔案
- [ ] 確認 `dist/index.html` 存在且為最新版本
- [ ] 確認 `dist/images/` 目錄包含所有必要圖片
- [ ] 檢查建置檔案大小是否合理

#### 步驟 1.2：設定環境變數
需要設定的環境變數：
```bash
export GCS_BUCKET=jutor-event-di1dzdgl64
export GCS_PATH=event/wordgym
```

**注意**：由於已經使用 `gcloud auth` 認證，不需要 `GCS_SA_KEY` 環境變數。

### 階段 2：執行部署

#### 步驟 2.1：執行部署腳本
執行命令：
```bash
npm run deploy:gcs
```

**預期行為**：
1. 檢查必要工具（gsutil, gcloud）✅
2. 載入配置（使用環境變數）✅
3. 驗證配置 ✅
4. 設定認證（使用現有 gcloud 認證）✅
5. 建置專案（如果 dist 不是最新）⚠️
6. 檢查 dist 目錄 ✅
7. **為 CSS/JS 添加版本參數** ✅
8. 上傳檔案到 GCS ✅
9. 設定 Cache-Control ✅
10. 設定公開讀取權限 ✅

#### 步驟 2.2：處理認證問題（如果需要）

**情況 A：腳本要求 Service Account Key**
- 問題：腳本可能要求 `GCS_SA_KEY` 或配置檔案
- 解決方案：
  - 選項 1：使用現有的 gcloud 認證（修改腳本跳過 Service Account 認證步驟）
  - 選項 2：創建 Service Account Key 並設定環境變數

**情況 B：權限不足**
- 問題：可能沒有寫入 bucket 的權限
- 解決方案：確認帳號有 `storage.objects.create` 和 `storage.objects.delete` 權限

### 階段 3：驗證部署

#### 步驟 3.1：檢查上傳結果
```bash
gsutil ls -r gs://jutor-event-di1dzdgl64/event/wordgym/
```

預期看到：
- `index.html`
- `images/` 目錄及其內容

#### 步驟 3.2：檢查檔案權限
```bash
gsutil iam get gs://jutor-event-di1dzdgl64/event/wordgym/
```

確認 `allUsers` 有 `objectViewer` 權限。

#### 步驟 3.3：測試訪問
訪問以下 URL 確認網站可以正常載入：
```
https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html
```

### 階段 4：後續處理

#### 步驟 4.1：檢查版本參數
檢查 `index.html` 中的 CSS/JS 引用是否已添加版本參數：
```bash
gsutil cat gs://jutor-event-di1dzdgl64/event/wordgym/index.html | grep -E '(\.css|\.js)'
```

#### 步驟 4.2：檢查 Cache-Control
確認 Cache-Control 設定正確：
```bash
gsutil stat gs://jutor-event-di1dzdgl64/event/wordgym/index.html | grep Cache-Control
```

## ⚠️ 潛在問題與解決方案

### 問題 1：腳本要求 Service Account Key
**原因**：腳本設計為使用 Service Account Key 進行認證

**解決方案**：
- 方案 A：修改腳本，支援使用現有 gcloud 認證
- 方案 B：創建 Service Account Key 並設定環境變數

### 問題 2：路徑不存在
**原因**：`event/wordgym/` 路徑尚未創建

**解決方案**：gsutil rsync 會自動創建不存在的路徑

### 問題 3：權限不足
**原因**：帳號可能沒有足夠權限

**解決方案**：確認帳號有以下權限：
- `storage.objects.create`
- `storage.objects.delete`
- `storage.objects.get`
- `storage.objects.list`
- `storage.buckets.get`

### 問題 4：版本控制功能
**原因**：如果專案使用 singlefile 插件，所有資源可能已內嵌

**解決方案**：腳本會自動檢測，如果沒有外部 CSS/JS 檔案會跳過版本控制

## 🔧 建議的執行方式

### 方式 1：使用現有認證（推薦）

由於已經有 gcloud 認證，可以：
1. 修改腳本跳過 Service Account 認證步驟
2. 直接使用 `gcloud auth` 的認證

### 方式 2：使用環境變數 + Service Account

如果需要使用 Service Account：
1. 創建 Service Account Key
2. 設定 `GCS_SA_KEY` 環境變數
3. 執行部署

### 方式 3：手動部署（備選）

如果腳本有問題，可以手動執行：
```bash
# 1. 建置
npm run build

# 2. 添加版本參數（可選）
node scripts/add-asset-versions.mjs dist

# 3. 上傳
gsutil -m rsync -r -d ./dist gs://jutor-event-di1dzdgl64/event/wordgym

# 4. 設定 Cache-Control
gsutil -m setmeta -h "Cache-Control:no-cache, no-store, must-revalidate" \
  "gs://jutor-event-di1dzdgl64/event/wordgym/*.html"

# 5. 設定公開權限
gsutil iam ch allUsers:objectViewer gs://jutor-event-di1dzdgl64/event/wordgym
```

## 📊 預期結果

部署成功後：
- ✅ 檔案已上傳到 `gs://jutor-event-di1dzdgl64/event/wordgym/`
- ✅ HTML 檔案中的 CSS/JS 引用已添加版本參數
- ✅ Cache-Control 已正確設定
- ✅ 公開讀取權限已設定
- ✅ 網站可以通過公開 URL 訪問

## 🚀 下一步行動

請確認：
1. 是否要使用現有 gcloud 認證，還是需要創建 Service Account Key？
2. 是否要修改腳本以支援使用現有認證？
3. 是否準備好執行部署？

確認後即可開始執行部署流程。
