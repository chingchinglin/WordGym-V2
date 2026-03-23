# 本機測試指南

## 🚀 快速開始

### 1. 啟動開發伺服器

```bash
npm run dev
```

開發伺服器會在 `http://localhost:5173` 啟動。

### 2. 在瀏覽器中打開

打開瀏覽器，訪問：`http://localhost:5173`

## ⚠️ 常見問題

### 問題 1: 無法載入 Google Sheets 資料

**症狀**: 應用程式啟動後沒有資料，或顯示載入錯誤

**原因**: 
- Google Sheets 需要「發布到網路」才能直接下載
- 或者需要正確的 CORS 設定

**解決方案**:

1. **確認 Google Sheets 已發布**:
   - 開啟 Google Sheets
   - 點選「檔案」→「發布到網路」
   - 選擇「整個文件」或「特定工作表」
   - 點選「發布」

2. **檢查 CSV URL**:
   確認 `src/services/CSVDataService.ts` 中的 URL 是否正確：
   ```typescript
   const CSV_URL = "https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0";
   ```

3. **使用本地 JSON 檔案**:
   如果 Google Sheets 無法訪問，應用程式會自動使用 `src/data/vocabulary.json` 作為備用資料。

### 問題 2: CORS 錯誤

**症狀**: 瀏覽器控制台顯示 CORS 相關錯誤

**解決方案**:
- 確保使用 `http://localhost:5173` 訪問（不是 `file://`）
- 開發環境中，Vite 會自動處理 CORS
- 如果仍有問題，檢查瀏覽器控制台的詳細錯誤訊息

### 問題 3: 資料未更新

**症狀**: 即使更新了 Google Sheets，應用程式仍顯示舊資料

**解決方案**:

1. **清除快取**:
   - 打開瀏覽器開發者工具（F12）
   - 進入「Application」→「Storage」
   - 清除「IndexedDB」和「Local Storage」

2. **強制重新載入**:
   - 在應用程式中，如果有「重新載入資料」按鈕，點選它
   - 或使用 `refreshCache()` 函數

3. **檢查快取時間**:
   - 預設快取時間為 24 小時
   - 可以在 `CSVDataService.ts` 中調整 `CACHE_EXPIRY_MS`

### 問題 4: 開發伺服器無法啟動

**症狀**: `npm run dev` 失敗或端口被占用

**解決方案**:

```bash
# 檢查端口是否被占用
lsof -ti:5173

# 如果端口被占用，可以：
# 1. 關閉占用端口的程序
kill -9 $(lsof -ti:5173)

# 2. 或使用其他端口
vite --port 3000
```

### 問題 5: TypeScript 編譯錯誤

**症狀**: 啟動時出現 TypeScript 錯誤

**解決方案**:

```bash
# 檢查 TypeScript 錯誤
npm run lint

# 或直接編譯檢查
npx tsc --noEmit
```

## 🔍 除錯技巧

### 1. 檢查瀏覽器控制台

打開瀏覽器開發者工具（F12），查看：
- Console 標籤：查看錯誤訊息和日誌
- Network 標籤：檢查 Google Sheets 請求是否成功

### 2. 檢查資料載入狀態

在瀏覽器控制台中執行：

```javascript
// 檢查資料是否已載入
console.log('資料數量:', window.__WORDGYM_DATA__?.length || '未載入');

// 檢查快取狀態
// 在 React DevTools 中查看 useDataset hook 的狀態
```

### 3. 測試 Google Sheets URL

在瀏覽器中直接訪問：

```
https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0
```

如果能看到 CSV 資料，表示 URL 正確。

### 4. 使用本地 JSON 檔案測試

如果 Google Sheets 無法訪問，可以：

1. 確保 `src/data/vocabulary.json` 存在且格式正確
2. 應用程式會自動使用此檔案作為備用資料
3. 檢查 `useDataset.ts` 中的備用邏輯

## 📝 測試檢查清單

- [ ] 開發伺服器成功啟動（`http://localhost:5173`）
- [ ] 瀏覽器可以訪問應用程式
- [ ] 沒有 CORS 錯誤
- [ ] 資料成功載入（檢查資料數量）
- [ ] 三民資料存在（搜尋「三民」相關單字）
- [ ] 篩選功能正常運作
- [ ] 測驗功能正常運作

## 🛠️ 進階測試

### 使用 Playwright 進行 E2E 測試

```bash
# 執行 E2E 測試
npm run test:e2e

# 使用 UI 模式
npm run test:e2e:ui
```

### 使用 Jest 進行單元測試

```bash
# 執行單元測試
npm test

# 監聽模式
npm run test:watch
```

## 📞 需要幫助？

如果以上方法都無法解決問題，請提供：
1. 瀏覽器控制台的錯誤訊息
2. 終端機的錯誤輸出
3. 具體的錯誤症狀描述
