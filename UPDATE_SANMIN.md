# 更新三民資料流程

## 📋 步驟說明

### 1. 從 Google Sheets 下載最新的 CSV

1. 開啟包含三民資料的 Google Sheets
2. 點選「檔案」→「下載」→「逗號分隔值 (.csv)」
3. 將檔案命名為 `WordGym for students 國高中 - 工作表1.csv`
4. 放在專案根目錄（覆蓋現有檔案）

### 2. 執行轉換腳本

```bash
./scripts/convert_vocabulary.sh
```

或直接使用 Python：

```bash
python3 scripts/csv_to_json.py "WordGym for students 國高中 - 工作表1.csv" "src/data/vocabulary.json"
```

### 3. 驗證結果

```bash
# 檢查 JSON 格式
python3 -m json.tool src/data/vocabulary.json > /dev/null && echo "✅ JSON 格式正確"

# 檢查三民資料
python3 -c "import json; data = json.load(open('src/data/vocabulary.json')); sanmin = [w for w in data if any('三民' in str(t.get('version', '')) for t in (w.get('textbook_index') or []))]; print(f'總單字數: {len(data)}'); print(f'三民單字數: {len(sanmin)}')"
```

### 4. 重新建置（如需要）

```bash
npm run build
```

## ⚠️ 注意事項

- 確保 CSV 檔案使用 UTF-8 編碼
- 轉換前建議備份 `src/data/vocabulary.json`
- 如果 Google Sheets 已設定為「發布到網路」，也可以使用 curl 下載
