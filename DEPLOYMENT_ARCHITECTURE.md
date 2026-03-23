# 部署架構說明

## 🏗️ 架構理解

### 實際部署架構

```
使用者訪問
    ↓
https://jutor.ai/event/wordgym/index.html
    ↓
[反向代理 / CDN]
    ↓
實際檔案位置
https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html
```

### 關鍵理解

1. **檔案存放位置**：GCS (`storage.googleapis.com`)
2. **使用者訪問 URL**：`jutor.ai/event/wordgym/...`
3. **反向代理**：`jutor.ai/event/` 自動對應到 GCS bucket
4. **瀏覽器看到的來源**：`jutor.ai`（不是 `storage.googleapis.com`）

---

## 🔒 CORS 白名單說明

### 為什麼不需要加入 `storage.googleapis.com`？

因為：
- ✅ 使用者實際訪問的網域是 `jutor.ai`
- ✅ 瀏覽器發出的請求，來源網域是 `jutor.ai`
- ✅ `jutor.ai` 和 `*.jutor.ai` **已經在白名單中**
- ✅ 後端 API 檢查的是**請求來源網域**，不是檔案存放位置

### CORS 檢查流程

```
1. 使用者在瀏覽器中訪問：https://jutor.ai/event/wordgym/index.html
   ↓
2. 網頁載入後，JavaScript 發起 API 請求：
   fetch('https://speech-token-server...a.run.app/api/get-speech-token')
   ↓
3. 瀏覽器自動在請求中加入 Origin header：
   Origin: https://jutor.ai
   ↓
4. 後端 API 檢查 Origin：
   ✅ jutor.ai 在白名單中 → 允許請求
   ↓
5. 回應 Token，CORS 成功
```

---

## 📝 測試時的注意事項

### ✅ 正確的測試方式

**使用這個 URL 測試：**
```
https://jutor.ai/event/wordgym/index.html
```

**原因：**
- 這是使用者實際訪問的 URL
- 瀏覽器會正確設定 Origin 為 `jutor.ai`
- CORS 檢查會通過

### ❌ 錯誤的測試方式

**不要使用這個 URL 測試：**
```
https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html
```

**原因：**
- 這是直接訪問 GCS，繞過了反向代理
- 瀏覽器會設定 Origin 為 `storage.googleapis.com`
- `storage.googleapis.com` 不在白名單中
- 會出現 CORS 錯誤

---

## 🎯 總結

### 部署流程

1. **部署到 GCS**：
   ```bash
   npm run deploy:gcs
   ```
   檔案上傳到：`gs://jutor-event-di1dzdgl64/event/wordgym/`

2. **使用者訪問**：
   透過：`https://jutor.ai/event/wordgym/index.html`
   （不是直接訪問 GCS URL）

3. **CORS 檢查**：
   - 來源網域：`jutor.ai` ✅
   - 白名單檢查：通過 ✅
   - 功能正常運作 ✅

### 不需要的動作

- ❌ 不需要請後端加入 `storage.googleapis.com` 到白名單
- ❌ 不需要修改後端設定
- ✅ 只需要確保使用 `jutor.ai/event/wordgym/...` 訪問

---

**最後更新：** 2025-01-21
