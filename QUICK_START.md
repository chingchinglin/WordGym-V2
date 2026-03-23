# 快速啟動指南

## 🚀 啟動開發伺服器

```bash
npm run dev
```

開發伺服器會在 `http://localhost:5173` 啟動。

## 🔗 測試連結

啟動後，訪問以下連結：

- **首頁**：http://localhost:5173
- **Debug 頁面**：http://localhost:5173/#/debug
- **詞彙詳情**：http://localhost:5173/#/word/1 (ID: 1 是 family)

## 🧪 測試詞形變化

1. 訪問：http://localhost:5173
2. 搜尋詞彙：`family`、`child`、`handsome`
3. 點擊詞彙進入詳情頁面
4. 查看「詞性與關聯字」區塊中的詞形變化

## 🛑 停止伺服器

按 `Ctrl + C` 停止開發伺服器

## ⚠️ 如果端口被占用

```bash
# 檢查端口
lsof -ti:5173

# 結束占用端口的進程
kill -9 $(lsof -ti:5173)

# 或使用其他端口
npm run dev -- --port 3000
```
