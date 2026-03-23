# Azure TTS 整合計劃與測試步驟

## 📋 概述

本文件說明如何將 `az-tts-lib` 整合到 WordGym 專案中，以改善語音品質（解決「機械音」問題）。

**預期影響範圍：** 小範圍修改，不影響其他功能

---

## 🔧 需要修改的檔案

### 1. `index.html`
**修改內容：** 加入 Microsoft Speech SDK 的 CDN script tag

**位置：** `<head>` 標籤內

**新增內容：**
```html
<!-- Azure Speech SDK (for az-tts-lib) -->
<script src="https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js"></script>
```

---

### 2. 新增檔案：`src/lib/jutor-tts.ts`
**來源：** 從 `/Applications/az-tts-lib/jutor-tts.js` 複製

**修改：**
- 將 `.js` 改為 `.ts`
- 添加 TypeScript 型別定義（如果需要）
- 保持原有功能不變

---

### 3. `src/utils/speechUtils.ts`
**修改內容：** 改用 Azure TTS，但保留原本的 SpeechSynthesis 作為 fallback

**修改策略：**
- 優先使用 Azure TTS（如果可用）
- 如果 Azure TTS 失敗或不可用，自動降級到原本的 SpeechSynthesis API
- 保持 `speak()` 和 `stopSpeech()` 的介面不變（確保其他程式碼不需要修改）

**預期修改：**
```typescript
// 偽代碼概念
export const speak = async (rawText: string): Promise<void> => {
  const text = String(rawText || "").trim();
  if (!text) return;

  try {
    // 嘗試使用 Azure TTS
    if (isAzureTTSAvailable()) {
      await azureSpeak(text);
    } else {
      // Fallback 到原本的 SpeechSynthesis
      browserSpeak(text);
    }
  } catch (error) {
    // 如果 Azure TTS 失敗，使用 fallback
    browserSpeak(text);
  }
};
```

---

## ✅ 不需要修改的檔案

以下檔案**不需要修改**，因為 `speechUtils.ts` 的介面保持不變：

- ✅ `src/hooks/useSpeech.ts` - 不需要修改
- ✅ `src/components/pages/WordDetailPage.tsx` - 不需要修改
- ✅ `src/components/quiz/FlashcardQuiz.tsx` - 不需要修改
- ✅ `src/components/quiz/MultipleChoiceQuiz.tsx` - 不需要修改
- ✅ `src/components/ui/SpeakerButton.tsx` - 不需要修改
- ✅ 其他所有檔案 - 不需要修改

---

## 🧪 測試步驟

### 階段 1：本機端測試（localhost）

#### 前置準備

1. **確認開發環境**
   ```bash
   # 確認 Node.js 和 npm 已安裝
   node --version
   npm --version
   ```

2. **確認專案可以正常啟動**
   ```bash
   npm install
   npm run dev
   ```
   應該可以在 `http://localhost:5173` 訪問

---

#### 步驟 1.1：整合程式碼

1. **修改 `index.html`**
   - 在 `<head>` 標籤內加入 Microsoft Speech SDK script
   - 位置：在 Google Tag Manager script 之後

2. **複製 `jutor-tts.js`**
   - 從 `/Applications/az-tts-lib/jutor-tts.js` 複製
   - 貼到 `src/lib/jutor-tts.ts`
   - 確認檔案格式正確

3. **修改 `src/utils/speechUtils.ts`**
   - 整合 Azure TTS 功能
   - 保留 fallback 機制
   - 確保介面不變

---

#### 步驟 1.2：啟動開發伺服器

```bash
npm run dev
```

應該會啟動在 `http://localhost:5173`

---

#### 步驟 1.3：基本功能測試

1. **開啟瀏覽器開發者工具（F12）**
   - 切換到 **Console** 標籤
   - 切換到 **Network** 標籤

2. **檢查 SDK 載入**
   - 在 Console 輸入：`typeof SpeechSDK`
   - 預期結果：`"object"`（表示 SDK 已載入）
   - 如果顯示 `"undefined"`，表示 SDK 未載入，檢查 `index.html` 的 script tag

3. **檢查 jutor-tts 模組**
   - 在 Console 輸入：`typeof window.JutorTTS`
   - 預期結果：`"object"`（表示模組已載入）

4. **訪問應用程式**
   - 打開 `http://localhost:5173`
   - 確認應用程式正常載入

---

#### 步驟 1.4：語音功能測試

1. **測試單字發音**
   - 進入任何一個單字詳細頁面
   - 點擊單字的發音按鈕
   - 確認可以聽到語音
   - 檢查 Console 是否有錯誤

2. **測試例句發音**
   - 在單字詳細頁面，點擊例句的發音按鈕
   - 確認可以聽到語音
   - 比較語音品質（應該比原本更自然）

3. **測試測驗頁面**
   - 進入閃卡測驗（FlashcardQuiz）
   - 點擊例句發音按鈕
   - 確認功能正常

4. **測試選擇題測驗**
   - 進入選擇題測驗（MultipleChoiceQuiz）
   - 答題後點擊「聽發音」按鈕
   - 確認功能正常

---

#### 步驟 1.5：檢查 Network 請求

1. **開啟 Network 標籤**
   - 過濾：`XHR` 或 `Fetch`
   - 點擊任何發音按鈕

2. **檢查 Token 請求**
   - 應該會看到對 `speech-token-server-t26idchpnq-de.a.run.app` 的請求
   - 狀態應該是 `200 OK`
   - 回應應該包含 `token` 和 `region`

3. **如果看到 CORS 錯誤**
   - 檢查錯誤訊息
   - 確認 `localhost` 在白名單中（應該在）
   - 如果不在，需要檢查後端設定

---

#### 步驟 1.6：錯誤處理測試

1. **測試網路斷線情況**
   - 開啟瀏覽器開發者工具
   - 切換到 Network 標籤
   - 選擇「Offline」模式
   - 嘗試播放語音
   - 預期：應該自動降級到 SpeechSynthesis API，不會報錯

2. **測試後端 API 失敗**
   - 如果可能，暫時阻擋對後端 API 的請求
   - 嘗試播放語音
   - 預期：應該自動降級到 SpeechSynthesis API

---

#### 步驟 1.7：語音品質比較

1. **記錄原本的語音品質**
   - 使用原本的 SpeechSynthesis API 播放一段文字
   - 注意語音的機械感、自然度

2. **測試 Azure TTS 語音品質**
   - 使用 Azure TTS 播放相同文字
   - 比較語音品質
   - 預期：Azure TTS 應該更自然、不機械

---

#### 本機端測試檢查清單

- [ ] SDK 成功載入（`typeof SpeechSDK === "object"`）
- [ ] jutor-tts 模組成功載入（`typeof window.JutorTTS === "object"`）
- [ ] 應用程式正常啟動
- [ ] 單字發音功能正常
- [ ] 例句發音功能正常
- [ ] 測驗頁面發音功能正常
- [ ] Token 成功取得（Network 標籤顯示 200）
- [ ] 沒有 Console 錯誤
- [ ] 語音品質明顯改善
- [ ] Fallback 機制正常（斷網測試）
- [ ] 錯誤處理正常

---

### 階段 2：GCS 部署測試（生產環境）

#### 前置準備

1. **確認部署架構**
   - ✅ **重要理解**：雖然檔案存放在 GCS (`storage.googleapis.com`)
   - ✅ 但使用者實際訪問的 URL 是：`https://jutor.ai/event/wordgym/...`
   - ✅ 因為有反向代理/CDN 設定，將 `jutor.ai/event/` 對應到 GCS
   - ✅ 瀏覽器看到的來源網域是 `jutor.ai`（不是 `storage.googleapis.com`）
   - ✅ 而 `jutor.ai` 和 `*.jutor.ai` **已經在白名單中**
   - ✅ **因此不需要額外加入 `storage.googleapis.com` 到白名單**

2. **確認本機端測試已通過**
   - 所有本機端測試項目都應該通過
   - 確認沒有明顯錯誤

---

#### 步驟 2.1：建置專案

```bash
npm run build
```

確認 `dist/index.html` 已生成

---

#### 步驟 2.2：部署到 GCS

```bash
# 設定環境變數
export GCS_BUCKET=jutor-event-di1dzdgl64
export GCS_PATH=event/wordgym

# 執行部署
npm run deploy:gcs
```

確認部署成功

---

#### 步驟 2.3：訪問部署後的網站

1. **開啟部署後的 URL**
   - **實際使用者訪問的 URL**（透過反向代理）：
     ```
     https://jutor.ai/event/wordgym/index.html
     ```
   - **直接 GCS URL**（僅供測試，實際使用者不會用這個）：
     ```
     https://storage.googleapis.com/jutor-event-di1dzdgl64/event/wordgym/index.html
     ```
   
   **注意**：測試時應該使用 `jutor.ai/event/wordgym/...`，因為這是使用者實際訪問的網址

2. **開啟瀏覽器開發者工具（F12）**
   - 切換到 **Console** 標籤
   - 切換到 **Network** 標籤

---

#### 步驟 2.4：檢查 CORS 設定

1. **檢查 Console**
   - 確認沒有 CORS 相關錯誤
   - **預期結果**：應該沒有 CORS 錯誤，因為 `jutor.ai` 已在白名單中
   - 如果看到 CORS 錯誤，可能是：
     - 使用了錯誤的 URL（直接訪問 `storage.googleapis.com` 而非 `jutor.ai`）
     - 後端服務問題

2. **檢查 Network 標籤**
   - 過濾：`XHR` 或 `Fetch`
   - 點擊任何發音按鈕
   - 檢查對 `speech-token-server-t26idchpnq-de.a.run.app` 的請求
   - **檢查請求的 Referer**：應該顯示 `jutor.ai`（不是 `storage.googleapis.com`）

3. **確認 Token 請求成功**
   - 請求狀態應該是 `200 OK`
   - 回應應該包含 `token` 和 `region`
   - 如果失敗，檢查錯誤訊息

---

#### 步驟 2.5：功能測試

1. **測試單字發音**
   - 進入任何一個單字詳細頁面
   - 點擊發音按鈕
   - 確認可以聽到語音
   - 確認語音品質良好

2. **測試例句發音**
   - 測試所有例句發音按鈕
   - 確認功能正常

3. **測試測驗頁面**
   - 測試閃卡測驗
   - 測試選擇題測驗
   - 確認所有發音功能正常

---

#### 步驟 2.6：跨瀏覽器測試

1. **Chrome**
   - 測試所有功能
   - 確認正常運作

2. **Safari**（如果可能）
   - 測試所有功能
   - 確認正常運作

3. **Firefox**（如果可能）
   - 測試所有功能
   - 確認正常運作

---

#### 步驟 2.7：效能測試

1. **檢查載入時間**
   - 確認 SDK 載入不會明顯影響頁面載入
   - 確認首次語音播放的延遲可接受

2. **檢查快取機制**
   - 播放相同文字多次
   - 確認第二次播放更快（使用快取）

---

#### GCS 部署測試檢查清單

- [ ] 確認使用正確的 URL（`jutor.ai/event/wordgym/...`，不是 `storage.googleapis.com`）
- [ ] 部署成功完成
- [ ] 可以訪問部署後的 URL（透過 `jutor.ai`）
- [ ] 沒有 CORS 錯誤（因為 `jutor.ai` 已在白名單中）
- [ ] SDK 成功載入
- [ ] Token 成功取得（Network 顯示 200）
- [ ] 請求的 Referer 是 `jutor.ai`（不是 `storage.googleapis.com`）
- [ ] 單字發音功能正常
- [ ] 例句發音功能正常
- [ ] 測驗頁面發音功能正常
- [ ] 語音品質良好
- [ ] 跨瀏覽器測試通過
- [ ] 效能可接受
- [ ] 沒有 Console 錯誤

---

## 🐛 常見問題與解決方案

### 問題 1：SDK 未載入

**症狀：** `typeof SpeechSDK === "undefined"`

**可能原因：**
- `index.html` 的 script tag 未正確加入
- CDN 連線問題
- 瀏覽器阻擋外部 script

**解決方案：**
1. 檢查 `index.html` 的 script tag
2. 確認 CDN URL 正確
3. 檢查瀏覽器 Console 是否有載入錯誤

---

### 問題 2：CORS 錯誤（本機端）

**症狀：** Console 顯示 CORS 相關錯誤

**可能原因：**
- `localhost` 不在後端白名單中（應該在）
- 後端服務未正常運作

**解決方案：**
1. 確認後端 API 正常運作
2. 檢查後端白名單設定
3. 確認使用 `http://localhost` 而非 `file://`

---

### 問題 3：CORS 錯誤（GCS 部署）

**症狀：** 部署後 Console 顯示 CORS 錯誤

**可能原因：**
- 使用了錯誤的 URL（直接訪問 `storage.googleapis.com` 而非 `jutor.ai`）
- 後端服務問題

**解決方案：**
1. **確認使用正確的 URL**：
   - ✅ 正確：`https://jutor.ai/event/wordgym/index.html`
   - ❌ 錯誤：`https://storage.googleapis.com/.../index.html`
2. 確認是透過 `jutor.ai` 訪問（瀏覽器地址欄應該顯示 `jutor.ai`）
3. 檢查 Network 標籤，確認請求的 Referer 是 `jutor.ai`
4. 如果仍失敗，檢查後端服務狀態

---

### 問題 4：Token 取得失敗

**症狀：** Network 標籤顯示 Token 請求失敗

**可能原因：**
- 後端 API 問題
- Rate Limit 觸發
- 網路連線問題

**解決方案：**
1. 檢查後端 API 狀態
2. 檢查 Rate Limit（10 次/15 分鐘）
3. 確認網路連線正常
4. 檢查錯誤訊息詳情

---

### 問題 5：語音播放失敗

**症狀：** 點擊發音按鈕沒有聲音

**可能原因：**
- SDK 未正確初始化
- 瀏覽器自動播放政策
- 音訊播放錯誤

**解決方案：**
1. 確認 SDK 已載入
2. 確認由使用者互動觸發（不是自動播放）
3. 檢查 Console 錯誤訊息
4. 確認瀏覽器音量未靜音

---

### 問題 6：Fallback 機制未運作

**症狀：** Azure TTS 失敗後，沒有降級到 SpeechSynthesis

**可能原因：**
- Fallback 邏輯未正確實作
- 錯誤處理不完整

**解決方案：**
1. 檢查 `speechUtils.ts` 的 fallback 邏輯
2. 確認錯誤處理正確
3. 測試斷網情況

---

## 📝 測試記錄範本

### 本機端測試記錄

**測試日期：** _______________

**測試環境：**
- 作業系統：_______________
- 瀏覽器：_______________
- Node.js 版本：_______________

**測試結果：**

| 測試項目 | 狀態 | 備註 |
|---------|------|------|
| SDK 載入 | ⬜ 通過 / ⬜ 失敗 | |
| 單字發音 | ⬜ 通過 / ⬜ 失敗 | |
| 例句發音 | ⬜ 通過 / ⬜ 失敗 | |
| Token 取得 | ⬜ 通過 / ⬜ 失敗 | |
| 語音品質 | ⬜ 改善 / ⬜ 無改善 | |
| Fallback | ⬜ 正常 / ⬜ 異常 | |

**發現的問題：**
1. 
2. 
3. 

---

### GCS 部署測試記錄

**測試日期：** _______________

**部署 URL：** _______________（應該是 `jutor.ai/event/wordgym/...`）

**測試環境：**
- 瀏覽器：_______________
- 網路環境：_______________

**測試結果：**

| 測試項目 | 狀態 | 備註 |
|---------|------|------|
| CORS 設定 | ⬜ 通過 / ⬜ 失敗 | |
| Token 取得 | ⬜ 通過 / ⬜ 失敗 | |
| 功能測試 | ⬜ 通過 / ⬜ 失敗 | |
| 跨瀏覽器 | ⬜ 通過 / ⬜ 失敗 | |
| 效能測試 | ⬜ 可接受 / ⬜ 需改善 | |

**發現的問題：**
1. 
2. 
3. 

---

## ✅ 完成標準

### 本機端測試完成標準

- ✅ 所有基本功能測試通過
- ✅ 語音品質明顯改善
- ✅ 沒有明顯錯誤
- ✅ Fallback 機制正常

### GCS 部署測試完成標準

- ✅ 部署成功
- ✅ 使用正確的 URL（`jutor.ai/event/wordgym/...`）
- ✅ 沒有 CORS 錯誤（因為 `jutor.ai` 已在白名單中）
- ✅ 所有功能正常運作
- ✅ 語音品質良好
- ✅ 使用者體驗良好

---

## 📞 需要協助時

如果遇到問題：

1. **檢查瀏覽器 Console**
   - 查看錯誤訊息
   - 記錄錯誤詳情

2. **檢查 Network 標籤**
   - 查看 API 請求狀態
   - 檢查回應內容

3. **檢查程式碼**
   - 確認所有修改正確
   - 確認沒有語法錯誤

4. **詢問後端工程師**
   - 如果 CORS 相關問題
   - 如果 Token 取得失敗

---

## 🎯 預期成果

整合完成後：

1. ✅ 語音品質明顯改善（不機械、更自然）
2. ✅ 所有現有功能正常運作
3. ✅ 自動 fallback 機制確保可靠性
4. ✅ 不影響其他功能
5. ✅ 使用者體驗提升

---

**最後更新：** 2025-01-21
