#!/usr/bin/env node
/**
 * 從 Google Sheets 下載 CSV 檔案
 */

import { writeFileSync } from 'fs';

const CSV_URL = "https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0";
const OUTPUT_FILE = "WordGym for students 國高中 - 工作表1.csv";

console.log('📥 從 Google Sheets 下載 CSV...');
console.log(`URL: ${CSV_URL}\n`);

try {
  const response = await fetch(CSV_URL);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const csvText = await response.text();
  
  writeFileSync(OUTPUT_FILE, csvText, 'utf-8');
  
  const lines = csvText.split('\n').length;
  console.log(`✅ 下載成功！`);
  console.log(`   檔案: ${OUTPUT_FILE}`);
  console.log(`   行數: ${lines}`);
  console.log(`   大小: ${(csvText.length / 1024).toFixed(2)} KB\n`);
  
} catch (error) {
  console.error('❌ 錯誤:', error.message);
  process.exit(1);
}
