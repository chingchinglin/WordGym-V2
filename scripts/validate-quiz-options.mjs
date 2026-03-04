#!/usr/bin/env node
/**
 * 驗證預生成測驗選項品質
 *
 * 使用方式：
 *   node scripts/validate-quiz-options.mjs
 *   node scripts/validate-quiz-options.mjs --sample=100  (抽樣輸出供人工審查)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const QUIZ_PATH = path.join(PROJECT_ROOT, 'src/data/quiz-options.json');
const VOCAB_PATH = path.join(PROJECT_ROOT, 'src/data/vocabulary.json');

const VALID_TYPES = new Set(['A', 'B', 'C', 'D', 'E', 'F']);
const VALID_QUESTION_TYPES = new Set(['單字題', '搭配詞題', '片語題']);
const REQUIRED_FIELDS = ['id', 'english_word', 'questionType', 'correctAnswer', 'distractors', 'grammarPoint'];
const DISTRACTOR_FIELDS = ['word', 'type', 'reason'];

// 解析參數
const sampleArg = process.argv.find(a => a.startsWith('--sample='));
const sampleSize = sampleArg ? parseInt(sampleArg.split('=')[1], 10) : 0;

// === 載入資料 ===
console.log('\n📂 載入資料...');
const quizData = JSON.parse(fs.readFileSync(QUIZ_PATH, 'utf-8'));
const vocabData = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const vocabMap = new Map(vocabData.map(w => [w.id, w]));

console.log(`   測驗選項: ${quizData.length} 題`);
console.log(`   詞彙資料: ${vocabData.length} 筆\n`);

// === 第一層：結構驗證 ===
console.log('=' .repeat(60));
console.log('📋 第一層：結構驗證（全量）');
console.log('='.repeat(60));

const structErrors = [];
const seenIds = new Set();

for (let i = 0; i < quizData.length; i++) {
  const item = quizData[i];
  const errors = [];

  // 必要欄位
  for (const field of REQUIRED_FIELDS) {
    if (item[field] === undefined || item[field] === null) {
      errors.push(`缺少欄位: ${field}`);
    }
  }

  // ID 唯一性
  if (seenIds.has(item.id)) {
    errors.push(`重複 ID: ${item.id}`);
  }
  seenIds.add(item.id);

  // correctAnswer 非空
  if (!item.correctAnswer || !item.correctAnswer.trim()) {
    errors.push('correctAnswer 為空');
  }

  // questionType 合法性
  if (item.questionType && !VALID_QUESTION_TYPES.has(item.questionType)) {
    errors.push(`無效題型: ${item.questionType}`);
  }

  // distractors 檢查
  if (Array.isArray(item.distractors)) {
    if (item.distractors.length !== 3) {
      errors.push(`干擾選項數量: ${item.distractors.length}（應為 3）`);
    }

    for (let j = 0; j < item.distractors.length; j++) {
      const d = item.distractors[j];

      // 必要欄位
      for (const field of DISTRACTOR_FIELDS) {
        if (d[field] === undefined || d[field] === null) {
          errors.push(`distractor[${j}] 缺少: ${field}`);
        }
      }

      // word 非空
      if (!d.word || !d.word.trim()) {
        errors.push(`distractor[${j}].word 為空`);
      }

      // type 合法性
      if (d.type && !VALID_TYPES.has(d.type)) {
        errors.push(`distractor[${j}].type 無效: ${d.type}`);
      }
    }
  } else {
    errors.push('distractors 不是陣列');
  }

  if (errors.length > 0) {
    structErrors.push({ index: i, id: item.id, word: item.english_word, errors });
  }
}

const structPass = quizData.length - structErrors.length;
console.log(`\n   ✅ 通過: ${structPass} / ${quizData.length} (${(structPass / quizData.length * 100).toFixed(1)}%)`);
console.log(`   ❌ 不通過: ${structErrors.length}`);

if (structErrors.length > 0) {
  console.log('\n   不通過的題目:');
  structErrors.slice(0, 20).forEach(e => {
    console.log(`   - [${e.id}] ${e.word}: ${e.errors.join('; ')}`);
  });
  if (structErrors.length > 20) {
    console.log(`   ... 還有 ${structErrors.length - 20} 題`);
  }
}

// === 第二層：規則驗證 ===
console.log('\n' + '='.repeat(60));
console.log('📏 第二層：規則驗證（全量）');
console.log('='.repeat(60));

let typeDiversityPass = 0;
let correctNotInDistractors = 0;
let noDuplicateDistractors = 0;
const typeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
const questionTypeCounts = {};
const diversityFailExamples = [];
const correctInDistractorExamples = [];
const duplicateDistractorExamples = [];

for (const item of quizData) {
  if (!Array.isArray(item.distractors)) continue;

  // 題型統計
  questionTypeCounts[item.questionType] = (questionTypeCounts[item.questionType] || 0) + 1;

  const types = item.distractors.map(d => d.type).filter(Boolean);
  const words = item.distractors.map(d => d.word?.toLowerCase()).filter(Boolean);

  // 類型統計
  for (const t of types) {
    if (typeCounts[t] !== undefined) typeCounts[t]++;
  }

  // 類型多樣性（至少 2 種不同類型）
  const uniqueTypes = new Set(types);
  if (uniqueTypes.size >= 2) {
    typeDiversityPass++;
  } else if (diversityFailExamples.length < 5) {
    diversityFailExamples.push({ id: item.id, word: item.english_word, types: types.join(',') });
  }

  // 正確答案不在干擾選項中
  const correctLower = item.correctAnswer?.toLowerCase();
  const isInDistractors = words.some(w => w === correctLower);
  if (!isInDistractors) {
    correctNotInDistractors++;
  } else if (correctInDistractorExamples.length < 5) {
    correctInDistractorExamples.push({ id: item.id, word: item.english_word, correct: item.correctAnswer, distractors: words });
  }

  // 干擾選項不重複
  const uniqueWords = new Set(words);
  if (uniqueWords.size === words.length) {
    noDuplicateDistractors++;
  } else if (duplicateDistractorExamples.length < 5) {
    duplicateDistractorExamples.push({ id: item.id, word: item.english_word, distractors: words });
  }
}

const total = quizData.length;

console.log('\n   --- 規則檢查 ---');
console.log(`   類型多樣性 (≥2 種): ${typeDiversityPass} / ${total} (${(typeDiversityPass / total * 100).toFixed(1)}%) ${typeDiversityPass / total >= 0.8 ? '✅' : '⚠️'}`);
console.log(`   正確答案未重複:     ${correctNotInDistractors} / ${total} (${(correctNotInDistractors / total * 100).toFixed(1)}%) ${correctNotInDistractors === total ? '✅' : '⚠️'}`);
console.log(`   干擾選項無重複:     ${noDuplicateDistractors} / ${total} (${(noDuplicateDistractors / total * 100).toFixed(1)}%) ${noDuplicateDistractors / total >= 0.99 ? '✅' : '⚠️'}`);

if (diversityFailExamples.length > 0) {
  console.log('\n   類型多樣性不足範例:');
  diversityFailExamples.forEach(e => console.log(`   - [${e.id}] ${e.word}: 類型 ${e.types}`));
}

if (correctInDistractorExamples.length > 0) {
  console.log('\n   正確答案出現在干擾選項:');
  correctInDistractorExamples.forEach(e => console.log(`   - [${e.id}] ${e.word}: 正確=${e.correct}, 干擾=${e.distractors.join(',')}`));
}

if (duplicateDistractorExamples.length > 0) {
  console.log('\n   重複干擾選項範例:');
  duplicateDistractorExamples.forEach(e => console.log(`   - [${e.id}] ${e.word}: ${e.distractors.join(',')}`));
}

// 分佈統計
const totalDistractors = Object.values(typeCounts).reduce((a, b) => a + b, 0);
console.log('\n   --- 干擾類型分佈 ---');
for (const [type, count] of Object.entries(typeCounts)) {
  const pct = (count / totalDistractors * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(count / totalDistractors * 40));
  console.log(`   類型${type}: ${count.toString().padStart(6)} (${pct.padStart(5)}%) ${bar}`);
}

console.log('\n   --- 題型分佈 ---');
for (const [type, count] of Object.entries(questionTypeCounts).sort((a, b) => b[1] - a[1])) {
  const pct = (count / total * 100).toFixed(1);
  console.log(`   ${type}: ${count.toString().padStart(6)} (${pct.padStart(5)}%)`);
}

// === 第三層：抽樣輸出 ===
if (sampleSize > 0) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 第三層：隨機抽樣 ${sampleSize} 題（供人工審查）`);
  console.log('='.repeat(60));

  // Fisher-Yates shuffle + slice
  const indices = Array.from({ length: quizData.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const sampled = indices.slice(0, sampleSize).sort((a, b) => a - b).map(i => quizData[i]);

  for (const item of sampled) {
    const vocab = vocabMap.get(item.id);
    console.log('\n   ---');
    console.log(`   ID: ${item.id} | 單字: ${item.english_word} | 階段: ${vocab?.stage || '?'}`);
    console.log(`   例句: ${vocab?.example_sentence || '(無)'}`);
    console.log(`   中文: ${vocab?.chinese_definition || '(無)'}`);
    console.log(`   題型: ${item.questionType} | 考點: ${item.grammarPoint}`);
    console.log(`   正確答案: ${item.correctAnswer}`);
    item.distractors.forEach((d, i) => {
      console.log(`   干擾${i + 1}: ${d.word} (類型${d.type}: ${d.reason})`);
    });
  }
}

// === 總結 ===
console.log('\n' + '='.repeat(60));
console.log('📊 驗證總結');
console.log('='.repeat(60));
console.log(`   總題數:           ${total}`);
console.log(`   結構通過:         ${structPass} / ${total} (${(structPass / total * 100).toFixed(1)}%)`);
console.log(`   類型多樣性:       ${typeDiversityPass} / ${total} (${(typeDiversityPass / total * 100).toFixed(1)}%)`);
console.log(`   正確答案未重複:   ${correctNotInDistractors} / ${total} (${(correctNotInDistractors / total * 100).toFixed(1)}%)`);
console.log(`   干擾選項無重複:   ${noDuplicateDistractors} / ${total} (${(noDuplicateDistractors / total * 100).toFixed(1)}%)`);

const allPass = structPass === total && typeDiversityPass / total >= 0.8 && correctNotInDistractors === total && noDuplicateDistractors / total >= 0.99;
console.log(`\n   ${allPass ? '✅ 整體驗證通過' : '⚠️ 有項目需要關注'}`);
console.log('='.repeat(60) + '\n');
