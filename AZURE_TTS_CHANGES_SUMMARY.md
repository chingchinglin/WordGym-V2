# Azure TTS 整合 - 修改範圍摘要

## 📝 快速參考

### 需要修改的檔案（共 3 個）

1. **`index.html`** - 加入 SDK script tag
2. **新增 `src/lib/jutor-tts.ts`** - 從 az-tts-lib 複製
3. **`src/utils/speechUtils.ts`** - 改用 Azure TTS（保留 fallback）

### 不需要修改的檔案（所有其他檔案）

- ✅ `src/hooks/useSpeech.ts` - **不需要修改**
- ✅ `src/components/pages/WordDetailPage.tsx` - **不需要修改**
- ✅ `src/components/quiz/FlashcardQuiz.tsx` - **不需要修改**
- ✅ `src/components/quiz/MultipleChoiceQuiz.tsx` - **不需要修改**
- ✅ `src/components/ui/SpeakerButton.tsx` - **不需要修改**
- ✅ 其他所有檔案 - **不需要修改**

---

## 🔧 修改詳情

### 1. `index.html`

**位置：** `<head>` 標籤內

**新增：**
```html
<!-- Azure Speech SDK (for az-tts-lib) -->
<script src="https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js"></script>
```

**影響：** 無，只是加入外部 script

---

### 2. 新增 `src/lib/jutor-tts.ts`

**來源：** `/Applications/az-tts-lib/jutor-tts.js`

**動作：** 複製檔案，改為 `.ts` 副檔名

**影響：** 無，新增檔案

---

### 3. `src/utils/speechUtils.ts`

**修改策略：**
- 保持 `speak()` 和 `stopSpeech()` 的**介面不變**
- 內部實作改用 Azure TTS
- 保留原本的 SpeechSynthesis 作為 fallback

**預期修改：**
- 引入 `jutor-tts.ts`
- 修改 `speak()` 函數：優先使用 Azure TTS，失敗時 fallback
- `stopSpeech()` 可能需要小調整

**影響：** 僅限於此檔案內部，對外介面不變

---

## ✅ 為什麼其他檔案不需要修改？

因為 `speechUtils.ts` 的**介面保持不變**：

```typescript
// 修改前
export const speak = (rawText: string): void => { ... }
export const stopSpeech = (): void => { ... }

// 修改後（介面相同）
export const speak = (rawText: string): void => { ... }  // 或 Promise<void>
export const stopSpeech = (): void => { ... }
```

所有使用這些函數的地方：
- `useSpeech.ts` - 只是重新匯出，不需要改
- `WordDetailPage.tsx` - 使用 `useSpeech()` hook，不需要改
- `FlashcardQuiz.tsx` - 直接 import `speak`，不需要改
- `MultipleChoiceQuiz.tsx` - 直接 import `speak`，不需要改

---

## 🎯 修改影響評估

### 影響範圍：**極小**

- ✅ 只修改 1 個現有檔案（`speechUtils.ts`）
- ✅ 新增 1 個檔案（`jutor-tts.ts`）
- ✅ 修改 1 個配置檔案（`index.html`）
- ✅ 所有其他檔案**完全不需要修改**

### 風險評估：**低**

- ✅ 介面保持不變，不會破壞現有功能
- ✅ 有 fallback 機制，即使 Azure TTS 失敗也能正常運作
- ✅ 修改範圍小，容易測試和回滾

---

## 📋 測試重點

### 本機端測試
1. SDK 載入成功
2. Token 取得成功
3. 語音功能正常
4. 語音品質改善
5. Fallback 機制正常

### GCS 部署測試
1. CORS 設定正確
2. 所有功能正常
3. 跨瀏覽器測試通過

---

## 🚀 執行順序

1. **修改程式碼**（3 個檔案）
2. **本機端測試**（localhost）
3. **確認後端白名單**（與後端工程師確認）
4. **部署到 GCS**
5. **生產環境測試**

---

**詳細測試步驟請參考：** `AZURE_TTS_INTEGRATION_PLAN.md`
