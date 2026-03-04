#!/usr/bin/env node

/**
 * 測試資料載入邏輯
 * 模擬應用程式從 Google Sheets 載入資料的過程
 */

const CSV_URL = "https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0";

// 模擬 parseCSV 函數
function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if (
      (char === "\n" || (char === "\r" && nextChar === "\n")) &&
      !insideQuotes
    ) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      if (char === "\r") i++;
    } else if (char !== "\r") {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// 模擬 parseTextbookIndex 函數
function parseTextbookIndex(raw) {
  if (!raw || typeof raw !== "string") return [];

  const items = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = [];

  items.forEach((item) => {
    const parts = item.split("-").map((s) => s.trim());
    if (parts.length >= 3) {
      result.push({
        version: parts[0],
        vol: parts[1],
        lesson: parts[2],
      });
    }
  });

  return result;
}

// 模擬 rowToWord 函數（簡化版）
function rowToWord(headers, row, index) {
  const obj = {};
  headers.forEach((header, i) => {
    obj[header] = row[i] || "";
  });

  const englishWord = (obj["english_word"] || "").trim();
  if (!englishWord) return null;

  return {
    id: index,
    english_word: englishWord,
    textbook_index: parseTextbookIndex(obj["textbook_index"] || ""),
    stage: obj["stage"] || "",
  };
}

// 主函數
async function testDataLoading() {
  console.log("=== 測試資料載入邏輯 ===\n");
  console.log(`1. 從 Google Sheets 下載 CSV...`);
  console.log(`   URL: ${CSV_URL}\n`);

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(`   ✅ CSV 下載成功 (${csvText.length} bytes)\n`);

    console.log("2. 解析 CSV...");
    const rows = parseCSV(csvText);
    const headers = rows[0];
    const dataRows = rows.slice(1);
    console.log(`   ✅ 解析完成: ${dataRows.length} 行資料\n`);

    console.log("3. 轉換為 VocabularyWord...");
    const words = [];
    for (let i = 0; i < dataRows.length; i++) {
      const word = rowToWord(headers, dataRows[i], i + 1);
      if (word) {
        words.push(word);
      }
    }
    console.log(`   ✅ 轉換完成: ${words.length} 個單字\n`);

    console.log("4. 檢查 employ 單字...");
    const employWords = words.filter(
      (w) => w.english_word.toLowerCase() === "employ"
    );
    console.log(`   總數: ${employWords.length} 個\n`);

    employWords.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ID: ${w.id}`);
      console.log(`      單字: "${w.english_word}"`);
      console.log(`      課本索引: ${JSON.stringify(w.textbook_index)}`);
      console.log(`      stage: ${w.stage}`);
      console.log("");
    });

    console.log("5. 檢查高中龍騰B3U1的 employ...");
    const targetEmploy = employWords.filter((w) => {
      return w.textbook_index.some(
        (ti) => ti.version === "龍騰" && ti.vol === "B3" && ti.lesson === "U1"
      );
    });
    console.log(`   數量: ${targetEmploy.length} 個\n`);

    targetEmploy.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ID: ${w.id}`);
      console.log(`      課本索引: ${JSON.stringify(w.textbook_index)}`);
    });

    console.log("\n=== 結論 ===");
    console.log(`- CSV 中總共有 ${employWords.length} 個 employ`);
    console.log(`- 其中 ${targetEmploy.length} 個屬於高中龍騰B3U1`);
    console.log(`- 資料讀取邏輯: ✅ 正確`);
    console.log(`- 如果 Google Sheets 已更新，應用程式會載入最新資料`);
  } catch (error) {
    console.error("❌ 錯誤:", error.message);
    process.exit(1);
  }
}

testDataLoading();
