# OpenAI LLM 呼叫快速參考

> 本文件供 Claude Code 在其他專案中快速實作 OpenAI LLM 呼叫使用。

## 架構概述

```
前端 (Browser) ──fetch──> 後端 Proxy (Node.js/Express) ──axios──> OpenAI API
                              │
                              └── 隱藏 API Key，提供 CORS 和 Rate Limiting
```

**正式環境後端 URL**：
```
https://speech-token-server-t26idchpnq-de.a.run.app
```

**API 端點**：
- 模型列表：`GET /api/llm-openai-server/models`
- 聊天完成：`POST /api/llm-openai-server/chat`

---

## 後端實作 (Node.js/Express)

### 必要依賴

```bash
npm install express axios cors dotenv express-rate-limit
```

### 環境變數

```env
OPENAI_API_KEY=sk-proj-your-key-here
PORT=8080
```

### 核心程式碼

```javascript
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json());

// Rate Limiting: 30 requests / 15 minutes
const openaiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many requests, please try again later'
});

// POST /api/llm-openai-server/chat
app.post('/api/llm-openai-server/chat', openaiLimiter, async (req, res) => {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
        return res.status(500).json({ error: 'Missing OpenAI API Key' });
    }

    const { model, messages, temperature, max_tokens } = req.body;

    // 驗證必填欄位
    if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: model and messages' });
    }

    // 構建請求
    const requestBody = {
        model,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 500
    };

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${openaiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );
        res.json(response.data);
    } catch (err) {
        const statusCode = err.response?.status || 500;
        const errorMessage = err.response?.data || { error: 'OpenAI API call failed' };
        res.status(statusCode).json(errorMessage);
    }
});

app.listen(process.env.PORT || 8080);
```

---

## 前端實作

### 基本呼叫函式

```javascript
const BACKEND_URL = 'https://speech-token-server-t26idchpnq-de.a.run.app';

/**
 * 呼叫 OpenAI Chat API
 * @param {Object} options
 * @param {string} options.model - 模型 ID (e.g., 'gpt-3.5-turbo', 'gpt-4')
 * @param {Array} options.messages - 訊息陣列 [{role, content}, ...]
 * @param {number} [options.temperature=0.7] - 隨機性 0-2
 * @param {number} [options.maxTokens=500] - 最大回應長度
 * @returns {Promise<string>} AI 回應文字
 */
async function callOpenAI({ model, messages, temperature = 0.7, maxTokens = 500 }) {
    const response = await fetch(`${BACKEND_URL}/api/llm-openai-server/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}
```

---

## 使用案例

### 案例 1: 簡單問答

```javascript
const answer = await callOpenAI({
    model: 'gpt-3.5-turbo',
    messages: [
        { role: 'user', content: '什麼是機器學習？用一句話解釋。' }
    ]
});
console.log(answer);
```

### 案例 2: 帶系統提示的對話

```javascript
const response = await callOpenAI({
    model: 'gpt-3.5-turbo',
    messages: [
        { role: 'system', content: '你是一位友善的英文老師，用繁體中文回答。' },
        { role: 'user', content: '請解釋 present perfect tense' }
    ],
    temperature: 0.5
});
```

### 案例 3: 文章生成 (來自 pgSpeak)

```javascript
async function generateArticle(keyword, level, wordCount) {
    const systemPrompt = `You are an English teacher. Generate a ${level} level article about ${wordCount} words.`;
    const userPrompt = `Write an article about: ${keyword}`;

    const text = await callOpenAI({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens: 500
    });

    return {
        keyword,
        level,
        wordCount: text.split(/\s+/).length,
        text,
        generatedAt: Date.now()
    };
}
```

### 案例 4: 答案評分分析

```javascript
async function analyzeAnswer(correctAnswer, studentAnswer) {
    const response = await callOpenAI({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: 'You are a helpful teaching assistant.'
            },
            {
                role: 'user',
                content: `比較學生答案與正確答案，提供 0-10 分評分。

正確答案：
${correctAnswer}

學生答案：
${studentAnswer}`
            }
        ],
        temperature: 0.3  // 低 temperature 讓評分更一致
    });

    return response;
}
```

### 案例 5: 多輪對話 (維護歷史)

```javascript
class ChatSession {
    constructor(systemPrompt = '') {
        this.messages = [];
        if (systemPrompt) {
            this.messages.push({ role: 'system', content: systemPrompt });
        }
    }

    async send(userMessage) {
        this.messages.push({ role: 'user', content: userMessage });

        const reply = await callOpenAI({
            model: 'gpt-3.5-turbo',
            messages: this.messages
        });

        this.messages.push({ role: 'assistant', content: reply });
        return reply;
    }

    clear() {
        const systemMsg = this.messages.find(m => m.role === 'system');
        this.messages = systemMsg ? [systemMsg] : [];
    }
}

// 使用方式
const chat = new ChatSession('你是一位旅遊顧問');
await chat.send('推薦台北一日遊景點');
await chat.send('第一個景點怎麼去？');  // 會記得上下文
```

---

## API 參數速查

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `model` | string | ✅ | `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo` |
| `messages` | array | ✅ | `[{role, content}, ...]` |
| `messages[].role` | string | ✅ | `system`, `user`, `assistant` |
| `messages[].content` | string | ✅ | 訊息內容 |
| `temperature` | number | | 0-2，預設 0.7，越高越隨機 |
| `max_tokens` | number | | 1-4096，預設 500 |

---

## 錯誤處理

```javascript
try {
    const result = await callOpenAI({ model, messages });
} catch (error) {
    if (error.message.includes('429')) {
        // Rate limit exceeded - 等待後重試
    } else if (error.message.includes('401')) {
        // API Key 無效
    } else if (error.message.includes('400')) {
        // 請求格式錯誤
    } else {
        // 其他錯誤
    }
}
```

---

## 相關檔案路徑

| 用途 | 路徑 |
|-----|------|
| 後端完整實作 | `back-end/server.js` |
| 前端測試頁面 | `playground/openai-test/script.js` |
| pgSpeak 使用案例 | `front-end/pgSpeak/script.js:945-1000` |
| 完整 API 文件 | `docs/OPENAI_INTEGRATION.md` |
