# 測驗選項即時生成 - 進度與問題記錄

> 更新日期：2026-02-13

---

## 目前狀態：🔴 阻塞中

**阻塞原因**：Google API 目前只提供 `gemini-3-flash-preview`，沒有正式版 `gemini-3-flash`

---

## 問題摘要

### 1. 模型問題

| 模型 | 狀態 | 問題 |
|------|------|------|
| `gemini-3-flash` | ❌ 不存在 | Google API 尚未開放 |
| `gemini-3-flash-preview` | ⚠️ 可用但有問題 | thinking 機制會吃掉 tokens，導致 JSON 截斷 |

### 2. `gemini-3-flash-preview` 的問題

```
問題：模型會先「思考」(thinking) 再生成回應

實測數據：
- maxOutputTokens: 2048
- thoughtsTokenCount: ~1962（思考用掉）
- candidatesTokenCount: ~82（實際輸出只剩這麼少）
- finishReason: "MAX_TOKENS"（被截斷）

結果：JSON 不完整，無法解析
```

### 3. 影響範圍

| 功能 | 影響 |
|------|------|
| 即時生成選項 | ❌ 大部分 API 呼叫失敗 |
| 預載功能 | ❌ 無法實現（API 不穩定） |
| 預先批次生成 | ❌ 同樣會失敗 |

---

## 測試過的解決方案

### 方案 1：增加 maxOutputTokens

```
maxOutputTokens: 8192

結果：
- thoughtsTokenCount: ~2952
- finishReason: "STOP" ✅
- JSON 完整 ✅

問題：
- thinking tokens 數量不可預測
- 無法保證每次都成功
- 不是根本解決方案
```

### 方案 2：使用其他模型

| 模型 | 結果 |
|------|------|
| `gemini-2.0-flash` | ✅ 可用，無 thinking 問題 |
| `gemini-2.5-flash` | ⚠️ 有 thinking，需高 maxOutputTokens |
| `gemini-flash-latest` | = `gemini-3-flash-preview`，同樣問題 |

---

## 待確認事項

1. **Google 何時會開放 `gemini-3-flash` 正式版？**
   - 已於 2025-12-17 發布，但 API 目前只有 preview

2. **是否有方法關閉 thinking 機制？**
   - 目前未找到相關參數

3. **是否改用 `gemini-2.0-flash`？**
   - 優點：穩定、無 thinking 問題
   - 缺點：不是最新模型

---

## 時間線

| 日期 | 事件 |
|------|------|
| 2026-02-11 | 開始實作即時生成功能 |
| 2026-02-13 | 發現 API 回傳 JSON 截斷問題 |
| 2026-02-13 | 確認原因：`gemini-3-flash-preview` 的 thinking 機制 |
| 2026-02-13 | 確認 `gemini-3-flash` 正式版不在 API 清單中 |
| 2026-02-13 | 等待 Google 開放正式版，或決定使用替代方案 |

---

## 下一步選項

1. **等待** - 等 Google 開放 `gemini-3-flash` 正式版
2. **使用 `gemini-2.0-flash`** - 穩定但非最新
3. **使用 `gemini-3-flash-preview` + 高 maxOutputTokens** - 可能不穩定
4. **改用 OpenAI 模型** - 需要測試費用和品質

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `src/services/QuizOptionsAPI.ts` | API 服務（目前使用 `gemini-3-flash-preview`） |
| `src/components/quiz/MultipleChoiceQuiz.tsx` | 測驗元件（有預載邏輯但無法正常運作） |
| `gemini-api-proxy.md` | Proxy 使用指南 |
| `.claude/rules/decision-change-policy.md` | 教訓記錄 |

---

*記錄者：Claude Code*
*最後更新：2026-02-13*
