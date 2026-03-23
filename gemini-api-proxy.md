# Gemini API Proxy 使用指南

> 供其他專案的 CLAUDE.md 引用，讓 Claude Code 知道如何呼叫 Gemini API。

## Base URL

| 環境 | URL |
|------|-----|
| Production | `https://speech-token-server-819106170113.asia-east1.run.app` |
| Local | `http://localhost:3000` |

## CORS 限制

請求必須帶上允許的 `Origin` header，否則會被拒絕：
- `https://www.jutor.ai` / `https://jutor.ai`
- `https://tts-syn.web.app` / `https://tts-syn.firebaseapp.com`
- `http://localhost:*` / `http://127.0.0.1:*`

## Rate Limit

30 requests / 15 min（per IP）。超過回傳 `429`。

---

## Endpoints

### 1. GET /api/llm-gemini-server/models

列出所有支援 `generateContent` 的 Gemini 模型。

```js
const res = await fetch(`${BASE_URL}/api/llm-gemini-server/models`);
const { models } = await res.json();
// models: [{ id, displayName, supportedGenerationMethods }]
```

**回應範例：**
```json
{
  "models": [
    { "id": "gemini-2.5-flash", "displayName": "Gemini 2.5 Flash", "supportedGenerationMethods": ["generateContent", "countTokens"] },
    { "id": "gemini-2.5-pro", "displayName": "Gemini 2.5 Pro", "supportedGenerationMethods": ["generateContent", "countTokens"] },
    { "id": "gemini-2.0-flash", "displayName": "Gemini 2.0 Flash", "supportedGenerationMethods": ["generateContent", "countTokens"] }
  ]
}
```

### 2. POST /api/llm-gemini-server/chat

Gemini `generateContent` 全功能代理，支援文字、圖片、音訊等多模態。

**Request Body：**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `model` | string | ✅ | 模型 ID（如 `gemini-2.5-flash`） |
| `contents` | array | ✅ | Gemini 訊息格式，非空陣列 |
| `systemInstruction` | string \| object | ❌ | 系統指示（字串會自動包裝） |
| `temperature` | number | ❌ | 0-2，控制隨機性 |
| `maxOutputTokens` | number | ❌ | 1-65536，最大輸出 token 數 |
| `topP` | number | ❌ | 0-1 |
| `topK` | number | ❌ | 1-100 |

**回應：** 直接轉發 Gemini 原始 JSON（`candidates`, `usageMetadata` 等）。

---

## 使用範例

### 純文字對話

```js
const res = await fetch(`${BASE_URL}/api/llm-gemini-server/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: '用一句話解釋什麼是 REST API' }] }],
    systemInstruction: '你是一位軟體工程教學助理，用繁體中文回答',
    temperature: 0.7,
    maxOutputTokens: 1024,
  }),
});

const data = await res.json();
const reply = data.candidates[0].content.parts[0].text;
```

### 圖片辨識（Vision）

```js
const res = await fetch(`${BASE_URL}/api/llm-gemini-server/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { text: '描述這張圖片的內容' },
        { inlineData: { mimeType: 'image/jpeg', data: '<base64-encoded-image>' } },
      ],
    }],
  }),
});
```

### 音訊處理

```js
const res = await fetch(`${BASE_URL}/api/llm-gemini-server/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { text: '請轉錄這段音訊' },
        { inlineData: { mimeType: 'audio/wav', data: '<base64-encoded-audio>' } },
      ],
    }],
  }),
});
```

### 多輪對話

```js
const res = await fetch(`${BASE_URL}/api/llm-gemini-server/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: '2 + 2 等於多少？' }] },
      { role: 'model', parts: [{ text: '4' }] },
      { role: 'user', parts: [{ text: '再乘以 3 呢？' }] },
    ],
    maxOutputTokens: 256,
  }),
});
```

---

## 模型選擇建議

| 模型 | 適用場景 | 備註 |
|------|----------|------|
| `gemini-2.5-flash` | 通用首選，速度快、支援 thinking | 推薦預設使用 |
| `gemini-2.5-pro` | 需要更高品質推理的任務 | 較慢、較貴 |
| `gemini-2.0-flash` | 輕量任務、低延遲 | 不含 thinking |

> **注意：** Gemini 2.5 系列有 thinking tokens（內部推理），會計入 `maxOutputTokens`。建議設定至少 `256` 以上，否則可能只有 thinking 沒有實際輸出。

---

## 錯誤處理

Proxy 會直接轉發 Gemini 上游的錯誤回應：

| HTTP Status | 原因 | 處理建議 |
|-------------|------|----------|
| 400 | 缺少 `model` 或 `contents` | 檢查 request body |
| 429 | Rate limit（proxy 或 Gemini 配額） | 等待後重試 |
| 500 | API key 未設定或上游錯誤 | 檢查 server logs |

```js
const res = await fetch(`${BASE_URL}/api/llm-gemini-server/chat`, { ... });
if (!res.ok) {
  const err = await res.json();
  console.error('Gemini API error:', err.error?.message || err.error);
  // 處理錯誤...
  return;
}
const data = await res.json();
```

---

## 在其他專案的 CLAUDE.md 中引用

在專案的 `CLAUDE.md` 加入以下區塊即可：

```markdown
## Gemini API 使用方式

本專案透過 Gemini API Proxy 呼叫 Gemini 模型。

- **文件**: `speak/back-end/docs/gemini-api-proxy.md`
- **Base URL**: `https://speech-token-server-819106170113.asia-east1.run.app`
- **主要端點**:
  - `GET /api/llm-gemini-server/models` — 列出可用模型
  - `POST /api/llm-gemini-server/chat` — 發送對話（支援多模態）
- **推薦模型**: `gemini-2.5-flash`
- **maxOutputTokens**: 2.5 系列建議至少 256（因 thinking tokens）
```

---

*建立日期：2026-02-10*
*對應 commit：feat: add Gemini LLM proxy endpoints (models + chat)*
