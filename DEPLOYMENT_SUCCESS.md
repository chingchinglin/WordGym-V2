# 🎉 部署成功！

## 部署資訊

- **Bucket**: `jutor-event-di1dzdgl64`
- **路徑**: `event/wordgym`
- **完整 GCS 路徑**: `gs://jutor-event-di1dzdgl64/event/wordgym/`
- **公開訪問 URL**: https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html

## 已部署的檔案

1. `index.html` (8.77 MB) - 主頁面（包含所有更新）
2. `images/favorites-girl.png` - 圖片資源
3. `images/favorites-girl.webp` - 圖片資源（WebP 格式）
4. `images/quiz-boy.png` - 圖片資源
5. `images/quiz-boy.webp` - 圖片資源（WebP 格式）

## 本次更新內容

### ✅ 已完成的更新

1. **三民資料更新**
   - 已從 Google Sheets 下載最新資料
   - 已更新 `vocabulary.json`（包含 1,898 個三民單字）
   - 總單字數：11,889 筆

2. **例句音檔功能**
   - ✅ WordDetailPage 所有例句都有音檔按鈕
   - ✅ FlashcardQuiz 例句有音檔按鈕
   - ✅ 所有音檔按鈕都能正常播放英文發音

3. **轉換腳本更新**
   - ✅ 更新 `convert_vocabulary.sh` 使用 `python3`

## 部署設定

- ✅ **Cache-Control**: HTML 檔案設定為 `no-cache, no-store, must-revalidate`（確保總是載入最新版本）
- ✅ **版本控制**: 已檢查，所有資源已內嵌到 HTML（使用 singlefile 插件）
- ✅ **認證方式**: 使用現有 gcloud 認證（`ching.lin@junyiacademy.org`）

## 注意事項

### 公開讀取權限

Bucket 使用了 **Uniform Bucket-Level Access**，因此無法在物件層級設定公開讀取權限。如果需要公開訪問，需要在 bucket 層級設定 IAM 權限：

```bash
gsutil iam ch allUsers:objectViewer gs://jutor-event-di1dzdgl64
```

或者透過 GCP Console 設定 bucket 的 IAM 權限。

### 訪問網站

如果 bucket 已設定公開讀取權限，可以通過以下 URL 訪問：
- https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html

## 下次部署

下次部署時，只需執行：

```bash
export GCS_BUCKET=jutor-event-di1dzdgl64
export GCS_PATH=event/wordgym
npm run deploy:gcs
```

腳本會自動：
1. 建置專案
2. 處理版本控制（如果有外部 CSS/JS）
3. 上傳檔案
4. 設定 Cache-Control
5. 嘗試設定公開權限

## 部署時間

部署時間：2025-01-16
