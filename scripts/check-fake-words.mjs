#!/usr/bin/env node
/**
 * 用 macOS 字典（23 萬字）檢查所有干擾選項是否為真實英文單字
 * 同時輸出 10% 抽樣供人工審查
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const QUIZ_PATH = path.join(PROJECT_ROOT, 'src/data/quiz-options.json');
const VOCAB_PATH = path.join(PROJECT_ROOT, 'src/data/vocabulary.json');
const DICT_PATH = '/usr/share/dict/words';
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'scripts/fake-words-report.txt');
const SAMPLE_PATH = path.join(PROJECT_ROOT, 'scripts/sample-10pct.txt');

// === 載入字典 ===
console.log('📖 載入 macOS 字典...');
const dictWords = new Set(
  fs.readFileSync(DICT_PATH, 'utf-8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(Boolean)
);
console.log(`   字典大小: ${dictWords.size} 字`);

// === 載入資料 ===
const quizData = JSON.parse(fs.readFileSync(QUIZ_PATH, 'utf-8'));
const vocabData = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const vocabMap = new Map(vocabData.map(w => [w.id, w]));
console.log(`   測驗選項: ${quizData.length} 題`);

// === 檢查每個干擾選項 ===
console.log('\n🔍 檢查所有干擾選項...\n');

function isRealWord(word) {
  if (!word) return false;
  const w = word.trim().toLowerCase();

  // 單一詞直接查字典
  if (dictWords.has(w)) return true;

  // 多字詞組（如 "morning person"）：檢查每個字
  if (w.includes(' ')) {
    return w.split(/\s+/).every(part => dictWords.has(part));
  }

  // 常見變形：加 s, ed, ing, er, est, ly
  // 字典可能不包含所有變形，所以也檢查去掉常見後綴的詞幹
  const suffixes = ['s', 'es', 'ed', 'ing', 'er', 'est', 'ly', 'tion', 'sion', 'ment', 'ness', 'ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'ial', 'ical'];
  for (const suffix of suffixes) {
    if (w.endsWith(suffix)) {
      const stem = w.slice(0, -suffix.length);
      if (stem.length >= 2 && dictWords.has(stem)) return true;
      // 雙寫子音去掉：running -> run
      if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
        if (dictWords.has(stem.slice(0, -1))) return true;
      }
      // e 結尾恢復：making -> make
      if (dictWords.has(stem + 'e')) return true;
    }
  }

  return false;
}

const suspiciousWords = []; // 可能是假字
const allDistractorWords = new Set();
let totalChecked = 0;
let realCount = 0;
let suspectCount = 0;

// 按類型統計
const typeStats = { A: { total: 0, suspect: 0 }, B: { total: 0, suspect: 0 }, C: { total: 0, suspect: 0 }, D: { total: 0, suspect: 0 }, E: { total: 0, suspect: 0 }, F: { total: 0, suspect: 0 } };

for (const item of quizData) {
  if (!Array.isArray(item.distractors)) continue;

  for (const d of item.distractors) {
    if (!d.word) continue;
    totalChecked++;
    allDistractorWords.add(d.word.toLowerCase());

    const type = d.type || '?';
    if (typeStats[type]) typeStats[type].total++;

    if (isRealWord(d.word)) {
      realCount++;
    } else {
      suspectCount++;
      if (typeStats[type]) typeStats[type].suspect++;
      suspiciousWords.push({
        id: item.id,
        english_word: item.english_word,
        distractor: d.word,
        type: d.type,
        reason: d.reason,
      });
    }
  }
}

// === 報告 ===
console.log('='.repeat(60));
console.log('📊 假字檢測結果');
console.log('='.repeat(60));
console.log(`   總干擾選項數: ${totalChecked}`);
console.log(`   不重複字數:   ${allDistractorWords.size}`);
console.log(`   字典確認真實: ${realCount} (${(realCount / totalChecked * 100).toFixed(1)}%)`);
console.log(`   可能為假字:   ${suspectCount} (${(suspectCount / totalChecked * 100).toFixed(1)}%)`);

console.log('\n   --- 按類型分佈 ---');
for (const [type, stats] of Object.entries(typeStats)) {
  if (stats.total === 0) continue;
  const pct = stats.total > 0 ? (stats.suspect / stats.total * 100).toFixed(1) : '0.0';
  console.log(`   類型${type}: ${stats.suspect} / ${stats.total} 可疑 (${pct}%)`);
}

// 輸出可疑字到檔案
if (suspiciousWords.length > 0) {
  const lines = ['# 可能為假字的干擾選項（需人工確認）', ''];
  lines.push(`總數: ${suspiciousWords.length}`);
  lines.push('注意: macOS 字典不包含所有合法英文字，以下部分可能是「字典沒收錄但真實存在的字」');
  lines.push('');

  for (const s of suspiciousWords) {
    lines.push(`[${s.id}] ${s.english_word} → 干擾: "${s.distractor}" (類型${s.type}: ${s.reason})`);
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'));
  console.log(`\n   📄 可疑字清單已輸出: scripts/fake-words-report.txt`);

  // 顯示前 30 個
  console.log('\n   --- 前 30 個可疑字 ---');
  suspiciousWords.slice(0, 30).forEach(s => {
    console.log(`   [${s.id}] ${s.english_word} → "${s.distractor}" (${s.type})`);
  });
  if (suspiciousWords.length > 30) {
    console.log(`   ... 還有 ${suspiciousWords.length - 30} 個，見 scripts/fake-words-report.txt`);
  }
}

// === 10% 抽樣 ===
console.log('\n' + '='.repeat(60));
console.log('🎲 10% 隨機抽樣');
console.log('='.repeat(60));

const sampleSize = Math.ceil(quizData.length * 0.1);
const indices = Array.from({ length: quizData.length }, (_, i) => i);
for (let i = indices.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [indices[i], indices[j]] = [indices[j], indices[i]];
}
const sampled = indices.slice(0, sampleSize).sort((a, b) => a - b).map(i => quizData[i]);

const sampleLines = [`# 10% 隨機抽樣（${sampleSize} 題）供人工審查`, ''];

for (const item of sampled) {
  const vocab = vocabMap.get(item.id);
  sampleLines.push('---');
  sampleLines.push(`ID: ${item.id} | 單字: ${item.english_word} | 階段: ${vocab?.stage || '?'}`);
  sampleLines.push(`例句: ${vocab?.example_sentence || '(無)'}`);
  sampleLines.push(`中文: ${vocab?.chinese_definition || '(無)'}`);
  sampleLines.push(`題型: ${item.questionType} | 考點: ${item.grammarPoint}`);
  sampleLines.push(`正確答案: ${item.correctAnswer}`);
  item.distractors.forEach((d, i) => {
    sampleLines.push(`  干擾${i + 1}: ${d.word} (類型${d.type}: ${d.reason})`);
  });
  sampleLines.push('');
}

fs.writeFileSync(SAMPLE_PATH, sampleLines.join('\n'));
console.log(`   抽樣數: ${sampleSize} 題`);
console.log(`   📄 已輸出: scripts/sample-10pct.txt`);
console.log('='.repeat(60) + '\n');
