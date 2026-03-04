# 測驗選項即時生成功能

> 開始日期：2026-02-11
> 狀態：**進行中**

---

## 任務目標

在選擇題測驗中，即時呼叫 Gemini API 生成干擾選項，取代現有的本地生成邏輯。

---

## 架構設計

```
使用者開始測驗
    ↓
顯示題目 + Loading 狀態
    ↓
呼叫 Gemini API 生成選項
    ↓
顯示選項（預期延遲 1-2 秒）
    ↓
（後續可加）快取結果到 localStorage
```

---

## API 資訊

| 項目 | 值 |
|------|-----|
| Base URL | `https://speech-token-server-819106170113.asia-east1.run.app` |
| Endpoint | `POST /api/llm-gemini-server/chat` |
| Model | `gemini-3-flash-preview` |
| API Key | pay-as-you-go（無每日限制） |
| Proxy 限制 | 30 requests / 15 min (per IP) |

---

## 實作步驟

### Step 1：建立 API 服務

**檔案**：`src/services/QuizOptionsAPI.ts`

**功能**：
- 呼叫 Gemini API
- 處理回應格式
- 錯誤處理

**狀態**：❌ 待開始

---

### Step 2：整合到測驗元件

**檔案**：`src/components/quiz/MultipleChoiceQuiz.tsx`

**改動**：
- 題目載入時呼叫 API
- 加入 Loading 狀態
- 顯示生成的選項

**狀態**：❌ 待開始

---

### Step 3：Fallback 機制

**當 API 失敗時**：
- 使用現有的本地生成邏輯
- 不影響使用者體驗

**狀態**：❌ 待開始

---

### Step 4：快取機制（可選）

**localStorage 快取**：
- 已生成的選項存入快取
- 下次遇到同單字直接使用

**狀態**：❌ 待開始

---

## 前置確認（開始前必做）

- [ ] 閱讀 `MultipleChoiceQuiz.tsx` 現有邏輯
- [ ] 確認如何取得 word ID
- [ ] 確認整合點位置
- [ ] 確認 CORS 設定（生產環境）

---

## 驗收標準

1. 選擇題可正常顯示 AI 生成的干擾選項
2. Loading 狀態正常顯示
3. API 失敗時 fallback 到現有邏輯
4. Console 無錯誤

---

## 相關文件

- 批次生成報告：`docs/QUIZ_OPTIONS_BATCH_GENERATION_COMPLETE.md`
- API 文件：`gemini-api-proxy.md`
- Prompt：`prompts/quiz-option-generation.md`

---

## 進度記錄

| 日期 | 進度 | 備註 |
|------|------|------|
| 2026-02-11 | 建立任務文件 | |

