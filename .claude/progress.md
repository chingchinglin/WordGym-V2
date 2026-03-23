# WordGym Students - Progress

## 2026-02-23

### 今日完成

1. **CLAUDE.md 新增出題規則** (commit `08e0eef`)
   - 6 種干擾選項類型（A~F）與 3 條禁止事項
   - 寫入 `### 出題規則` 區段，位於 Services 表格之後

2. **驗證 API Key 為付費版**
   - Key: 已確認可用（連打 3 次不被 429 擋住）
   - 模型: `gemini-3-flash-preview` 可用

3. **改善出題 prompt**
   - 問題: 測試時出現假字 "snakey"
   - 修正: 在 `scripts/generate-quiz-options.mjs` 的 System Prompt 中加強禁止造字規則
   - 驗證: 修正後再跑 5 題，0 假字

4. **測試出題腳本**
   - 第一批 5 題: 4/5 通過（1 題有假字 snakey）
   - 修正 prompt 後第二批 5 題: 5/5 全部通過
   - 目前已完成: 65 題

### 目前狀態

| 項目 | 數值 |
|------|------|
| 詞彙總數 | 13,997 |
| 有例句的 | 13,615 |
| 已生成選項 | 65 |
| 待生成 | ~13,550 |

### 明日繼續

1. **批次生成測驗選項**
   - 指令: `node scripts/generate-quiz-options.mjs --limit=0`
   - 腳本有斷點續傳，從第 66 題繼續
   - 每題間隔 30 秒，預估需要數天跑完
   - 可分批跑：`--limit=500` 每次 500 題

2. **注意事項**
   - API Key 已暴露在對話中，建議重新產生一組
   - 腳本目前走 Cloud Run Proxy，不是直接打 Gemini API
   - 費用估算: 全量約 NT$250~590
