# jutor.ai 無法開啟故障排除指南

## 🔍 可能原因與解決方案

### 1. 反向代理/CDN 設定問題 ⚠️ **最常見**

**症狀：**
- 訪問 `https://jutor.ai/event/wordgym/index.html` 顯示 404 或 502
- 瀏覽器顯示「無法連線到此網站」

**可能原因：**
- `jutor.ai/event/` 路徑未正確設定反向代理到 GCS bucket
- CDN 設定錯誤或未生效
- 反向代理規則未包含 `wordgym` 路徑

**解決方案：**
1. **檢查反向代理設定**（需要後端/DevOps 協助）：
   - 確認 `jutor.ai/event/*` 路徑已設定反向代理
   - 確認目標 bucket：`jutor-event-di1dzdgl64`
   - 確認目標路徑：`event/wordgym/`

2. **驗證 GCS 檔案是否存在**：
   ```bash
   # 檢查檔案是否存在
   gsutil ls -r gs://jutor-event-di1dzdgl64/event/wordgym/
   
   # 應該看到：
   # gs://jutor-event-di1dzdgl64/event/wordgym/index.html
   # gs://jutor-event-di1dzdgl64/event/wordgym/images/...
   ```

3. **測試直接訪問 GCS**（僅供驗證，不是正式訪問方式）：
   ```
   https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html
   ```
   - 如果這個可以訪問，問題在反向代理設定
   - 如果這個也不能訪問，問題在 GCS 部署

---

### 2. GCS 檔案未正確上傳

**症狀：**
- 直接訪問 GCS URL 也無法開啟
- 檔案不存在或檔案損壞

**檢查步驟：**

1. **檢查檔案是否存在**：
   ```bash
   gsutil ls gs://jutor-event-di1dzdgl64/event/wordgym/
   ```

2. **檢查檔案內容**：
   ```bash
   # 檢查 index.html 是否存在且不為空
   gsutil stat gs://jutor-event-di1dzdgl64/event/wordgym/index.html
   
   # 查看檔案前幾行（確認內容正確）
   gsutil cat gs://jutor-event-di1dzdgl64/event/wordgym/index.html | head -20
   ```

3. **重新部署**：
   ```bash
   export GCS_BUCKET=jutor-event-di1dzdgl64
   export GCS_PATH=event/wordgym
   npm run deploy:gcs
   ```

---

### 3. GCS 權限問題

**症狀：**
- 訪問時顯示「拒絕存取」或 403 錯誤
- 檔案存在但無法讀取

**檢查步驟：**

1. **檢查 bucket 權限**：
   ```bash
   # 檢查 bucket IAM 權限
   gsutil iam get gs://jutor-event-di1dzdgl64
   ```

2. **檢查物件權限**：
   ```bash
   # 檢查檔案權限
   gsutil stat gs://jutor-event-di1dzdgl64/event/wordgym/index.html
   ```

3. **設定公開讀取權限**（如果需要）：
   ```bash
   # 設定 bucket 層級的公開讀取權限
   gsutil iam ch allUsers:objectViewer gs://jutor-event-di1dzdgl64
   
   # 或設定特定路徑的權限
   gsutil iam ch allUsers:objectViewer gs://jutor-event-di1dzdgl64/event/wordgym
   ```

**注意：** 如果 bucket 使用 Uniform Bucket-Level Access，需要在 bucket 層級設定 IAM 權限。

---

### 4. 路徑錯誤

**症狀：**
- 訪問 `jutor.ai/event/wordgym/` 顯示 404
- 但訪問 `jutor.ai/event/` 其他路徑可以正常運作

**檢查步驟：**

1. **確認部署路徑正確**：
   - 部署路徑應該是：`event/wordgym`
   - 完整 GCS 路徑：`gs://jutor-event-di1dzdgl64/event/wordgym/`

2. **確認訪問 URL 正確**：
   - ✅ 正確：`https://jutor.ai/event/wordgym/index.html`
   - ❌ 錯誤：`https://jutor.ai/wordgym/index.html`
   - ❌ 錯誤：`https://jutor.ai/event/wordgym/`（缺少 index.html）

3. **檢查檔案結構**：
   ```bash
   # 列出所有檔案
   gsutil ls -r gs://jutor-event-di1dzdgl64/event/wordgym/
   ```

---

### 5. DNS/CDN 快取問題

**症狀：**
- 部署後立即訪問，顯示舊版本或 404
- 某些地區可以訪問，某些地區不行

**解決方案：**

1. **清除 CDN 快取**（需要後端/DevOps 協助）：
   - 清除 `jutor.ai/event/wordgym/*` 的快取
   - 等待 CDN 快取更新（可能需要幾分鐘到幾小時）

2. **強制重新載入**：
   - 瀏覽器：`Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
   - 或使用無痕模式測試

3. **檢查 CDN 設定**：
   - 確認 CDN 的 Cache-Control 設定
   - HTML 檔案應該設定為 `no-cache, no-store, must-revalidate`

---

### 6. 檔案損壞或建置失敗

**症狀：**
- 檔案存在但無法正常顯示
- 瀏覽器顯示空白頁面或錯誤

**檢查步驟：**

1. **檢查建置是否成功**：
   ```bash
   # 本地建置測試
   npm run build
   
   # 檢查 dist/index.html 是否存在且正常
   ls -lh dist/index.html
   ```

2. **檢查檔案大小**：
   ```bash
   # 檢查 GCS 上的檔案大小
   gsutil du -h gs://jutor-event-di1dzdgl64/event/wordgym/index.html
   
   # 應該與本地建置的檔案大小相近（約 8-9 MB）
   ```

3. **檢查檔案內容**：
   ```bash
   # 檢查 HTML 開頭是否正確
   gsutil cat gs://jutor-event-di1dzdgl64/event/wordgym/index.html | head -30
   ```

---

### 7. 瀏覽器快取問題

**症狀：**
- 顯示舊版本內容
- 功能異常但檔案已更新

**解決方案：**

1. **清除瀏覽器快取**：
   - Chrome/Edge: `Ctrl+Shift+Delete` → 清除快取
   - Firefox: `Ctrl+Shift+Delete` → 清除快取
   - Safari: `Cmd+Option+E` → 清除快取

2. **強制重新載入**：
   - `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)

3. **使用無痕模式測試**：
   - 開啟無痕視窗，訪問 `https://jutor.ai/event/wordgym/index.html`

---

## 🔧 快速診斷流程

### Step 1: 檢查 GCS 檔案是否存在

```bash
gsutil ls -r gs://jutor-event-di1dzdgl64/event/wordgym/
```

**預期結果：**
- 應該看到 `index.html` 和 `images/` 目錄
- 如果沒有，需要重新部署

### Step 2: 測試直接訪問 GCS

訪問：`https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html`

**結果判斷：**
- ✅ 可以訪問 → 問題在反向代理設定
- ❌ 無法訪問 → 問題在 GCS 部署或權限

### Step 3: 檢查反向代理設定

**需要後端/DevOps 協助檢查：**
- `jutor.ai/event/*` 是否正確設定反向代理
- 目標 bucket 和路徑是否正確
- CDN 快取是否需要清除

### Step 4: 檢查瀏覽器 Console

開啟瀏覽器開發者工具（F12），檢查：
- Network 標籤：是否有 404、403、502 等錯誤
- Console 標籤：是否有 JavaScript 錯誤
- 請求的 URL 和狀態碼

---

## 📋 檢查清單

部署後無法從 jutor.ai 開啟時，請依序檢查：

- [ ] GCS 檔案是否存在且正確上傳
- [ ] GCS 權限設定正確（公開讀取）
- [ ] 訪問 URL 正確（`https://jutor.ai/event/wordgym/index.html`）
- [ ] 反向代理設定正確（需要後端確認）
- [ ] CDN 快取已清除（如果需要）
- [ ] 瀏覽器快取已清除
- [ ] 檔案內容完整且未損壞
- [ ] 建置過程無錯誤

---

## 🆘 需要協助時

如果以上步驟都無法解決問題，請提供以下資訊：

1. **錯誤訊息**：瀏覽器顯示的具體錯誤
2. **HTTP 狀態碼**：Network 標籤中的狀態碼（404、403、502 等）
3. **GCS 檢查結果**：`gsutil ls` 的輸出
4. **直接訪問 GCS 結果**：是否可以直接訪問 `storage.googleapis.com` URL
5. **部署時間**：何時部署的
6. **瀏覽器 Console 錯誤**：任何 JavaScript 錯誤訊息

---

## 📞 聯絡資訊

- **GCS 部署問題**：檢查部署腳本和 GCS 設定
- **反向代理問題**：需要後端/DevOps 團隊協助
- **CDN 快取問題**：需要後端/DevOps 團隊協助
