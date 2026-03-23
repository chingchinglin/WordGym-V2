# OpenAI API 整合文件

本文件說明如何設定和使用 OpenAI API 整合功能。

## 功能概述

後端提供兩個 OpenAI API 端點：

1. **`GET /api/llm-openai-server/models`** - 查詢可用的 OpenAI 模型列表
2. **`POST /api/llm-openai-server/chat`** - 發送聊天完成請求

## 後端 URL

**正式環境後端 URL**：
```
https://speech-token-server-t26idchpnq-de.a.run.app
```

所有 API 端點皆使用此 URL 作為 base URL。

---

## 後端設定

### 1. 取得 OpenAI API Key

1. 前往 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登入您的帳號
3. 點擊「Create new secret key」
4. 複製生成的 API Key（格式：`sk-proj-...`）

**重要**：API Key 只會顯示一次，請妥善保存。

### 2. 部署時設定環境變數

在部署後端時，設定 `OPENAI_API_KEY` 環境變數：

```bash
export OPENAI_API_KEY='sk-proj-your-actual-key-here'
export AZURE_SPEECH_KEY='your-azure-key'
./deploy-backend.sh
```

或使用內聯方式：

```bash
OPENAI_API_KEY='sk-proj-your-key' AZURE_SPEECH_KEY='your-azure-key' ./deploy-backend.sh
```

### 3. 驗證部署

部署完成後，測試端點是否正常：

```bash
# 測試模型列表端點
curl https://speech-token-server-t26idchpnq-de.a.run.app/api/llm-openai-server/models

# 應該回傳 JSON 格式的模型列表
```

## 前端使用

### 測試頁面

專案包含一個獨立的測試頁面：`front-end/openai-test.html`

1. 將測試頁面上傳到前端伺服器（或使用本地伺服器）
2. 開啟 `openai-test.html`
3. 頁面會自動載入可用的模型列表
4. 選擇模型後即可開始對話

### 後端 URL 配置

測試頁面已配置使用正式環境後端：

```javascript
const BACKEND_URL = 'https://speech-token-server-t26idchpnq-de.a.run.app';
```

如需使用本地開發環境，可改為：
```javascript
const BACKEND_URL = 'http://localhost:8080';
```

## API 端點詳情

### GET /api/llm-openai-server/models

查詢可用的 OpenAI 模型列表。

**請求**：
```bash
GET /api/llm-openai-server/models
```

**回應**：
```json
{
  "models": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai"
    },
    ...
  ]
}
```

### POST /api/llm-openai-server/chat

發送聊天完成請求。

**請求**：
```bash
POST /api/llm-openai-server/chat
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

**參數說明**：
- `model` (必填): 模型 ID，例如 `gpt-3.5-turbo`、`gpt-4`
- `messages` (必填): 訊息陣列，每個訊息包含：
  - `role`: `system`、`user` 或 `assistant`
  - `content`: 訊息內容
- `temperature` (選填): 0-2，控制回應的隨機性（預設: 0.7）
- `max_tokens` (選填): 1-4096，最大回應長度（預設: 500）

**回應**：
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'm doing well, thank you for asking!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 7,
    "total_tokens": 20
  }
}
```

## 安全機制

### Rate Limiting

OpenAI 端點設有 rate limiting：
- **限制**：每 15 分鐘 30 次請求
- **超過限制**：回傳 429 狀態碼

### CORS 保護

端點僅允許來自白名單的來源：
- 生產環境：`https://www.jutor.ai`、`https://jutor.ai`
- 開發環境：`http://localhost:*`、`http://127.0.0.1:*`

### 輸入驗證

- 驗證 `model` 和 `messages` 必填
- 驗證 `messages` 格式正確
- 限制 `temperature` 在 0-2 範圍
- 限制 `max_tokens` 在 1-4096 範圍

## 錯誤處理

### 常見錯誤

1. **500 Internal Server Error - Missing OpenAI API Key**
   - 原因：未設定 `OPENAI_API_KEY` 環境變數
   - 解決：部署時設定環境變數

2. **401 Unauthorized**
   - 原因：OpenAI API Key 無效或過期
   - 解決：檢查 API Key 是否正確，或建立新的 Key

3. **403 Forbidden - Invalid origin**
   - 原因：請求來源不在 CORS 白名單中
   - 解決：確認前端 URL 是否在白名單中

4. **429 Too Many Requests**
   - 原因：超過 rate limiting 限制
   - 解決：等待 15 分鐘後再試

5. **400 Bad Request**
   - 原因：請求參數格式錯誤
   - 解決：檢查請求體格式是否符合 API 規格

## 成本考量

OpenAI API 按使用量計費，建議：

1. **監控使用量**：定期檢查 OpenAI 使用量報告
2. **設定預算**：在 OpenAI 平台設定使用量預算
3. **使用 Rate Limiting**：已內建 rate limiting 防止濫用
4. **選擇合適模型**：根據需求選擇模型（gpt-3.5-turbo 較便宜）

## 故障排除

### 檢查環境變數

部署後，檢查 Cloud Run 服務的環境變數：

```bash
gcloud run services describe speech-token-server \
  --region asia-east1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### 查看日誌

```bash
gcloud run services logs read speech-token-server \
  --region asia-east1 \
  --limit 50
```

### 本地測試

在本地開發時，建立 `.env` 檔案：

```env
OPENAI_API_KEY=sk-proj-your-key-here
SPEECH_KEY=your-azure-key
SPEECH_REGION=eastus
PORT=8080
```

然後執行：

```bash
cd back-end
npm install
node server.js
```

## 參考資源

- [OpenAI API 文件](https://platform.openai.com/docs/api-reference)
- [OpenAI 模型列表](https://platform.openai.com/docs/models)
- [OpenAI 定價](https://openai.com/pricing)

