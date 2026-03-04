#!/usr/bin/env node
/**
 * 從 Google Sheets 檢查詞形變化資料
 */

const CSV_URL = "https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0";

console.log('📚 從 Google Sheets 檢查詞形變化資料\n');
console.log('='.repeat(60));
console.log(`URL: ${CSV_URL}\n`);

try {
  console.log('正在下載 CSV 資料...');
  const response = await fetch(CSV_URL);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const csvText = await response.text();
  console.log(`✅ 成功下載，資料長度: ${csvText.length} 字元\n`);
  
  // 解析 CSV
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  console.log('📋 CSV 欄位:');
  headers.forEach((header, idx) => {
    if (header.includes('詞形變化')) {
      console.log(`   ${idx + 1}. ${header} ⭐ (詞形變化欄位)`);
    } else {
      console.log(`   ${idx + 1}. ${header}`);
    }
  });
  
  // 找出詞形變化欄位的索引
  const wordFormsIndex = headers.findIndex(h => h.includes('詞形變化'));
  
  if (wordFormsIndex === -1) {
    console.log('\n❌ 找不到「詞形變化」欄位！');
    process.exit(1);
  }
  
  console.log(`\n✅ 找到「詞形變化」欄位，索引: ${wordFormsIndex + 1}\n`);
  
  // 解析資料行
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // 簡單的 CSV 解析（處理引號內的逗號）
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current); // 最後一個欄位
    
    if (row.length > wordFormsIndex && row[wordFormsIndex] && row[wordFormsIndex].trim()) {
      const englishWord = row[headers.indexOf('english_word')] || '';
      rows.push({
        row: i + 1,
        english_word: englishWord.trim(),
        word_forms: row[wordFormsIndex].trim()
      });
    }
  }
  
  console.log(`📊 統計資訊:`);
  console.log(`   - 總資料行數: ${lines.length - 1}`);
  console.log(`   - 有詞形變化資料的行數: ${rows.length}`);
  console.log(`   - 比例: ${((rows.length / (lines.length - 1)) * 100).toFixed(2)}%\n`);
  
  if (rows.length === 0) {
    console.log('⚠️  目前 Google Sheets 中沒有詞形變化資料');
    console.log('   請確認是否已在 Google Sheets 的「詞形變化」欄位中填入資料\n');
  } else {
    console.log('📝 詞形變化資料範例:\n');
    rows.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. 第 ${item.row} 行: ${item.english_word}`);
      const preview = item.word_forms.length > 100 
        ? item.word_forms.substring(0, 100) + '...'
        : item.word_forms;
      console.log(`   內容: ${preview.replace(/\n/g, '\\n')}`);
      console.log('');
    });
    
    if (rows.length > 10) {
      console.log(`   ... 還有 ${rows.length - 10} 筆資料\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log('✅ 檢查完成\n');
  
} catch (error) {
  console.error('❌ 錯誤:', error.message);
  console.error(error.stack);
  process.exit(1);
}
