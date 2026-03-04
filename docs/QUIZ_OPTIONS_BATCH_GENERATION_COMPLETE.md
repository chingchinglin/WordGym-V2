# 測驗選項批次生成 - 小規模測試完成報告

> 完成日期：2026-02-11
> 狀態：**已完成**

---

## 任務摘要

使用 Gemini API 預生成測驗選項（干擾選項），測試 API 整合與輸出品質。

---

## 測試結果

| 項目 | 值 |
|------|-----|
| 模型 | gemini-3-flash-preview |
| 生成數量 | 55 筆 |
| 成功率 | 100% |
| 階段 | 國中 |
| 耗時 | ~25 分鐘 |

---

## 輸出檔案

| 檔案 | 路徑 | 說明 |
|------|------|------|
| 測驗選項 | `src/data/quiz-options.json` | 55 筆預生成資料 |
| 進度追蹤 | `scripts/.quiz-options-progress.json` | 斷點續傳用 |
| 生成腳本 | `scripts/generate-quiz-options.mjs` | 批次生成工具 |

---

## 資料結構

```json
{
  "id": 10,
  "english_word": "child",
  "questionType": "單字題",
  "correctAnswer": "child",
  "distractors": [
    { "word": "children", "type": "A", "reason": "複數形" },
    { "word": "childish", "type": "B", "reason": "詞性錯誤" },
    { "word": "chill", "type": "D", "reason": "拼寫相近" }
  ],
  "grammarPoint": "單數名詞與動詞一致性"
}
```

---

## 品質評估

- ✅ 所有干擾選項皆為真實英文單字
- ✅ 干擾類型多元（A 詞形、B 詞性、C 語意、D 拼寫）
- ✅ 考點說明清楚
- ✅ JSON 格式正確

---

## 批次生成參數

```javascript
// scripts/generate-quiz-options.mjs
const CONFIG = {
  GEMINI_BASE_URL: 'https://speech-token-server-819106170113.asia-east1.run.app',
  MODEL: 'gemini-3-flash-preview',
  RATE_LIMIT_DELAY: 30000,  // 30 秒間隔（Proxy 限制: 30/15min）
  MAX_RETRIES: 1
};
```

---

## 剩餘工作（暫緩）

| 項目 | 數量 | 預估時間 |
|------|------|----------|
| 國中剩餘 | 6,005 筆 | ~50 小時 |
| 高中 | 7,937 筆 | ~66 小時 |

---

## 使用方式

```bash
# 執行批次生成（國中）
node scripts/generate-quiz-options.mjs --stage=國中 --limit=100

# 預覽模式
node scripts/generate-quiz-options.mjs --stage=國中 --limit=10 --dry-run
```

---

## 下一步

→ 進入新任務：**線上即時生成測驗選項功能**

見文件：`docs/QUIZ_OPTIONS_REALTIME_GENERATION.md`
