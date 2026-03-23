# 詞形變化功能測試連結

## 🌐 線上測試連結

### 1. GitHub Pages（自動部署）
**連結**：https://youngger9765.github.io/WordGym-students-merge/

**說明**：
- ✅ 每次 push 到 main 分支會自動更新
- ✅ 公開訪問，無需登入
- ⚠️ 可能需要清除瀏覽器快取才能看到最新更新

### 2. Google Cloud Storage（GCS）
**連結**：https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html

**說明**：
- ✅ 正式部署環境
- ✅ 需要手動部署或設定自動部署
- ⚠️ 可能需要清除瀏覽器快取

## 💻 本地測試

### 方式 1：開發伺服器（推薦）

```bash
# 1. 安裝依賴（如果還沒安裝）
npm install

# 2. 啟動開發伺服器
npm run dev
```

開發伺服器會在 `http://localhost:5173` 啟動。

**優點**：
- ✅ 即時更新（Hot Module Replacement）
- ✅ 自動處理 CORS
- ✅ 最佳開發體驗

### 方式 2：預覽建置版本

```bash
# 1. 建置專案
npm run build

# 2. 預覽建置結果
npm run preview
```

預覽伺服器會在 `http://localhost:4173` 啟動。

### 方式 3：靜態檔案伺服器

```bash
# 建置專案
npm run build

# 使用 Python 啟動本地伺服器
python3 -m http.server 8000
# 或
python -m SimpleHTTPServer 8000

# 然後訪問：http://localhost:8000/dist/index.html
```

## 🧪 測試詞形變化功能

### 測試步驟

1. **開啟應用程式**（使用上述任一連結）

2. **搜尋有詞形變化的詞彙**，例如：
   - `family` - 應該顯示「複數：families」
   - `handsome` - 應該顯示「比較級：handsomer；最高級：handsomest」
   - `child` - 應該顯示「複數：children」
   - `go` - 應該顯示動詞變化

3. **點擊詞彙進入詳情頁面**

4. **檢查「詞性與關聯字」區塊**
   - 應該能看到「詞形變化」區塊
   - 格式應該類似：
     ```
     詞形變化
     ┌─────────────────────────┐
     │ 名詞                     │
     │   複數：families        │
     └─────────────────────────┘
     ```

### 測試詞彙清單

以下詞彙已確認有詞形變化資料，可用於測試：

| 詞彙 | 詞形變化 |
|------|---------|
| family | n.複數：families |
| husband | n.複數：husbands |
| wife | n.複數：wives |
| child | n.複數：children |
| handsome | adj.比較級：handsomer；最高級：handsomest |

**總共有 6,893 筆詞彙包含詞形變化資料**

## 🔍 驗證資料

### 檢查 JSON 資料

```bash
# 執行測試腳本
node scripts/test-word-forms.mjs
```

### 檢查 Google Sheets 資料

```bash
# 檢查 Google Sheets 中的詞形變化
node scripts/check-google-sheet-word-forms.mjs
```

## 🐛 疑難排解

### 問題 1：看不到詞形變化

**可能原因**：
- 瀏覽器快取舊資料
- JSON 檔案未更新

**解決方法**：
1. 清除瀏覽器快取（Ctrl+Shift+Delete 或 Cmd+Shift+Delete）
2. 確認 `src/data/vocabulary.json` 已更新
3. 檢查詞彙是否真的有詞形變化資料

### 問題 2：開發伺服器無法啟動

**檢查**：
```bash
# 檢查端口是否被占用
lsof -ti:5173

# 如果被占用，結束進程
kill -9 $(lsof -ti:5173)
```

### 問題 3：資料未更新

**確認步驟**：
1. 確認已從 Google Sheets 下載最新 CSV：
   ```bash
   node scripts/download-csv-from-google-sheet.mjs
   ```

2. 確認已執行轉換：
   ```bash
   bash scripts/convert_vocabulary.sh
   ```

3. 驗證 JSON 資料：
   ```bash
   node scripts/test-word-forms.mjs
   ```

## 📊 資料統計

- **總詞彙數**：11,888 筆
- **有詞形變化**：6,893 筆（57.98%）
- **格式**：物件陣列格式 `[{"pos": "名詞", "details": "複數：families"}]`

## 📝 測試檢查清單

- [ ] 開發伺服器成功啟動
- [ ] 可以搜尋詞彙
- [ ] 詞彙詳情頁面正常顯示
- [ ] 「詞性與關聯字」區塊顯示
- [ ] 詞形變化資料正確顯示
- [ ] 格式正確（詞性 + 詳細資訊）
- [ ] 多個詞形變化正確分隔
