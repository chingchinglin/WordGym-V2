# 詞形變化功能使用說明

## 概述

本系統已完整支援詞形變化功能，可以從 Google Sheet 的 CSV 檔案匯入並正確顯示詞形變化資料。

## CSV 格式說明

在 Google Sheet 的「詞形變化」欄位中，支援兩種格式：

### 格式 1：簡化格式（推薦，Google Sheets 常用）

```
n.複數：families
adj.比較級：handsomer；最高級：handsomest
v.過去式：went；過去分詞：gone；現在分詞：going
```

### 格式 2：完整格式

```
名詞
可數；複數: families

形容詞
比較級: more beautiful
最高級: most beautiful
```

### 動詞變化範例

```
動詞
過去式: went
過去分詞: gone
現在分詞: going
第三人稱單數: goes
```

### 多詞性範例

```
名詞
可數；複數: criminals

形容詞
比較級: more criminal
最高級: most criminal
```

## 格式規則

### 簡化格式（格式 1）
1. **詞性縮寫**：使用英文縮寫（n., v., adj., adv., prep., conj., pron., interj.）
2. **變化類型**：直接寫變化類型，如「複數」、「比較級」、「最高級」等
3. **分隔符號**：使用分號（；）分隔多個變化
4. **範例**：`n.複數：families`、`adj.比較級：handsomer；最高級：handsomest`

### 完整格式（格式 2）
1. **詞性標題**：使用中文詞性名稱（名詞、動詞、形容詞、副詞、介係詞、連接詞、代名詞、感嘆詞）
2. **詳細資訊**：每個詞性下方可以有多行詳細資訊，使用換行分隔
3. **分隔符號**：詳細資訊可以使用分號（；）或換行分隔
4. **空行**：詞性之間使用空行分隔

## 資料處理流程

1. **CSV 匯入**：`scripts/csv_to_json.py` 中的 `parse_word_forms()` 函數會解析詞形變化欄位
2. **格式轉換**：將文字格式轉換為結構化格式：
   ```json
   [
     {
       "pos": "名詞",
       "details": "可數；複數: families"
     },
     {
       "pos": "形容詞",
       "details": "比較級: more beautiful\n最高級: most beautiful"
     }
   ]
   ```
3. **UI 顯示**：`WordDetailPage.tsx` 會將結構化資料顯示在詞彙詳情頁面

## UI 顯示位置

詞形變化會顯示在詞彙詳情頁面的「詞性與關聯字」區塊中，格式如下：

```
詞形變化
┌─────────────────────────────────┐
│ 名詞                            │
│   可數；複數: families          │
│                                 │
│ 形容詞                          │
│   比較級: more beautiful        │
│   最高級: most beautiful        │
└─────────────────────────────────┘
```

## 測試

### 執行測試腳本

```bash
node scripts/test-word-forms.mjs
```

### 執行單元測試

```bash
npm test -- wordForms.test.ts
```

## 更新資料流程

1. 在 Google Sheet 中更新「詞形變化」欄位
2. 下載 CSV 檔案（確保檔名為 `WordGym for students 國高中 - 工作表1.csv`）
3. 執行轉換腳本：
   ```bash
   bash scripts/convert_vocabulary.sh
   ```
4. 重新載入應用程式以查看更新

## 注意事項

- 確保 CSV 檔案使用 UTF-8 編碼
- 詞性名稱必須使用中文（名詞、動詞等）
- 詳細資訊可以使用分號或換行分隔
- 如果詞形變化欄位為空，系統會自動跳過顯示

## 範例資料

以下是一些完整的範例：

### 範例 1：動詞 go

```
動詞
過去式: went
過去分詞: gone
現在分詞: going
第三人稱單數: goes
```

### 範例 2：名詞 child

```
名詞
可數；複數: children
```

### 範例 3：形容詞 good

```
形容詞
比較級: better
最高級: best
```

### 範例 4：多詞性 criminal

```
名詞
可數；複數: criminals

形容詞
比較級: more criminal
最高級: most criminal
```

## 技術細節

- **解析函數**：`scripts/csv_to_json.py` 中的 `parse_word_forms()`
- **顯示元件**：`src/components/pages/WordDetailPage.tsx`
- **資料處理**：`src/utils/dataProcessing.ts` 中的 `normalizeWordFormsDetail()`
- **類型定義**：`src/types/index.ts` 中的 `WordFormsDetail` 介面
