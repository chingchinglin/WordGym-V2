# 如何從 Google Sheets 更新 JSON 資料

本指南說明如何從 Google Sheets 更新 `src/data/vocabulary.json` 檔案。

## 📋 前置需求

- Python 3.x
- 專案根目錄的 CSV 檔案

## 🔄 更新流程

### 方法一：使用 Shell 腳本（最簡單）

1. **從 Google Sheets 下載 CSV**
   - 開啟 Google Sheets
   - 檔案 → 下載 → 逗號分隔值 (.csv)
   - 將檔案命名為 `WordGym for students 國高中 - 工作表1.csv`
   - 放在專案根目錄

2. **執行轉換腳本**
   ```bash
   # 確保腳本有執行權限
   chmod +x scripts/convert_vocabulary.sh
   
   # 執行轉換
   ./scripts/convert_vocabulary.sh
   ```

3. **驗證結果**
   - 檢查 `src/data/vocabulary.json` 是否已更新
   - 檔案應該包含所有單字資料

### 方法二：直接使用 Python 腳本

1. **下載 CSV 檔案**（同上）

2. **執行 Python 腳本**
   ```bash
   python scripts/csv_to_json.py "WordGym for students 國高中 - 工作表1.csv" "src/data/vocabulary.json"
   ```

### 方法三：從 Google Sheets URL 直接下載

如果您的 Google Sheets 已設定為「發布到網路」，可以使用以下方式：

1. **取得 CSV 下載 URL**
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
   ```
   
   範例（從 CSVDataService.ts）：
   ```
   https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0
   ```

2. **下載 CSV**
   ```bash
   # 使用 curl 下載
   curl -o "WordGym for students 國高中 - 工作表1.csv" \
     "https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0"
   ```

3. **執行轉換**
   ```bash
   ./scripts/convert_vocabulary.sh
   ```

## 📝 CSV 欄位對應

Python 腳本會自動將中文欄位名稱對應到英文欄位：

| CSV 欄位（中文） | JSON 欄位（英文） |
|-----------------|------------------|
| stage | stage |
| textbook_index | textbook_index |
| exam_tags | exam_tags |
| level | level |
| CEFR | cefr |
| 主題 | theme_index |
| english_word | english_word |
| KK音標 | kk_phonetic |
| 中譯 | chinese_definition |
| 例句 | example_sentence |
| 翻譯 | example_translation |
| 詞性 | pos |
| 詞性變化 | word_forms |
| 片語 | phrases |
| 同義字 | synonyms |
| 反義字 | antonyms |
| 易混淆字 | confusables |
| 字首 | prefix (affix_info) |
| 字尾 | suffix (affix_info) |
| 字根 | root (affix_info) |

## 🔍 資料處理說明

腳本會自動處理以下事項：

1. **合併重複單字**：相同 `english_word`（不區分大小寫）會自動合併
2. **解析陣列欄位**：`exam_tags`、`synonyms` 等會解析為陣列
3. **正規化階段**：從 `textbook_index` 推斷 `stage`（國中/高中）
4. **清理英文單字**：移除 POS 標註、音標等
5. **提取詞性**：從 `中譯` 欄位提取詞性標籤

## ✅ 驗證更新

轉換完成後，建議：

1. **檢查檔案大小**
   ```bash
   wc -l src/data/vocabulary.json
   ```

2. **檢查 JSON 格式**
   ```bash
   python -m json.tool src/data/vocabulary.json > /dev/null && echo "✅ JSON 格式正確"
   ```

3. **測試應用程式**
   ```bash
   npm run dev
   # 檢查應用程式是否能正常載入資料
   ```

## 🚀 重新建置

更新 JSON 後，記得重新建置：

```bash
npm run build
```

## ⚠️ 注意事項

1. **備份原始檔案**：更新前建議備份 `src/data/vocabulary.json`
2. **編碼格式**：確保 CSV 檔案使用 UTF-8 編碼
3. **欄位格式**：
   - `textbook_index` 格式：`版本-冊次-課次`（例如：`龍騰-B1-U4`）
   - `theme_index` 格式：`範圍-主題`（例如：`1200-Holidays-festivals`）
   - 陣列欄位使用分號 `;` 分隔

## 🐛 疑難排解

### 問題：Python 腳本執行失敗

**解決方案**：
```bash
# 檢查 Python 版本
python --version  # 應該 >= 3.6

# 檢查檔案路徑
ls -la "WordGym for students 國高中 - 工作表1.csv"
```

### 問題：JSON 格式錯誤

**解決方案**：
```bash
# 檢查 JSON 語法
python -m json.tool src/data/vocabulary.json
```

### 問題：欄位對應錯誤

**解決方案**：
- 檢查 CSV 第一行是否包含正確的欄位名稱
- 參考 `scripts/csv_to_json.py` 中的 `field_mapping` 字典

## 📚 相關檔案

- `scripts/csv_to_json.py` - CSV 轉 JSON 的主要腳本
- `scripts/convert_vocabulary.sh` - 自動化轉換腳本
- `src/data/vocabulary.json` - 輸出的 JSON 檔案
- `src/services/CSVDataService.ts` - CSV 資料服務（可選）

## 🔗 相關連結

- [Google Sheets CSV 匯出格式](https://support.google.com/docs/answer/40608)
- [專案 README](./README.md)
