#!/usr/bin/env node
/**
 * 預生成測驗選項腳本
 *
 * 使用方式：
 *   node scripts/generate-quiz-options.mjs [--limit=50] [--start=0]
 *
 * 參數：
 *   --limit=N   只處理 N 筆（預設: 50，設為 0 處理全部）
 *   --start=N   從第 N 筆開始（用於斷點續傳）
 *   --dry-run   只顯示會處理哪些題目，不實際呼叫 API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// === 設定 ===
const CONFIG = {
  GEMINI_BASE_URL: 'https://speech-token-server-819106170113.asia-east1.run.app',
  MODEL: 'gemini-3-flash-preview',
  RATE_LIMIT_DELAY: 2500, // 2.5 秒間隔（30 req/15 min = 2 req/min）
  MAX_RETRIES: 3,
  VOCABULARY_PATH: path.join(PROJECT_ROOT, 'src/data/vocabulary.json'),
  OUTPUT_PATH: path.join(PROJECT_ROOT, 'src/data/quiz-options.json'),
  PROGRESS_PATH: path.join(PROJECT_ROOT, 'scripts/.quiz-options-progress.json'),
};

// === System Prompt ===
const SYSTEM_PROMPT = `你是英文測驗出題專家。這是一個「詞彙測驗」，測試學生是否認識正確單字，以及對應的詞形變化、文法、搭配詞和片語。

【題目類型判斷】
根據例句和正確答案，判斷這是哪種題型：
- 單字題：測試單字的正確詞形（時態、單複數、比較級等）
- 搭配詞題：測試動詞+名詞、形容詞+名詞等固定搭配
- 片語題：測試慣用語、片語動詞等

【最重要規則 - 真實單字】
所有干擾選項必須是「真正存在的英文單字或片語」！
❌ 禁止使用不存在的字：childs, runned, goed, weath, thinked
✅ 使用真實的字：children, ran, went, weather, thought

【干擾選項類型 - 從以下6種中選3種不同類型】
類型A - 詞形錯誤：錯誤的時態/單複數/比較級（但必須是真實存在的詞形）
類型B - 詞性錯誤：衍生詞但詞性錯誤
類型C - 語意相反：意思相反的字
類型D - 拼寫易混淆：長得像但意思不同
類型E - 發音相似：同音或近音異義字
類型F - 搭配錯誤：常見的錯誤搭配

【禁止事項】
1. ❌ 禁止使用不存在的英文單字！
2. ❌ 禁止使用「語意相近且填進去也通順」的同義詞！

【回傳格式】
只回傳 JSON，不要有其他文字：
{
  "questionType": "單字題/搭配詞題/片語題",
  "correctAnswer": "正確答案（依例句調整詞形）",
  "distractors": [
    {"word": "干擾選項1", "type": "類型A/B/C/D/E/F", "reason": "為何這是錯誤選項"},
    {"word": "干擾選項2", "type": "類型A/B/C/D/E/F", "reason": "為何這是錯誤選項"},
    {"word": "干擾選項3", "type": "類型A/B/C/D/E/F", "reason": "為何這是錯誤選項"}
  ],
  "grammarPoint": "此題考點"
}`;

// === 工具函數 ===
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { limit: 50, start: 0, dryRun: false };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--start=')) {
      options.start = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadProgress() {
  try {
    if (fs.existsSync(CONFIG.PROGRESS_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('⚠️  無法讀取進度檔案，從頭開始');
  }
  return { completedIds: [], results: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(CONFIG.PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadExistingResults() {
  try {
    if (fs.existsSync(CONFIG.OUTPUT_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG.OUTPUT_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('⚠️  無法讀取現有結果檔案');
  }
  return [];
}

// === API 呼叫 ===
async function callGeminiAPI(word, retryCount = 0) {
  const userPrompt = `例句：${word.example_sentence}
測驗單字：${word.english_word}`;

  try {
    const response = await fetch(`${CONFIG.GEMINI_BASE_URL}/api/llm-gemini-server/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        systemInstruction: SYSTEM_PROMPT,
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        temperature: 0.3,
        maxOutputTokens: 1024
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // 解析 JSON（移除可能的 markdown code block）
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    return {
      id: word.id,
      english_word: word.english_word,
      ...result
    };
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`   ⚠️  重試 ${retryCount + 1}/${CONFIG.MAX_RETRIES}...`);
      await sleep(5000); // 重試前等待 5 秒
      return callGeminiAPI(word, retryCount + 1);
    }
    throw error;
  }
}

// === 主程式 ===
async function main() {
  const options = parseArgs();
  console.log('\n🚀 開始生成測驗選項\n');
  console.log(`   模型: ${CONFIG.MODEL}`);
  console.log(`   限制: ${options.limit === 0 ? '全部' : options.limit} 筆`);
  console.log(`   起始: 第 ${options.start} 筆`);
  console.log(`   模式: ${options.dryRun ? '預覽（不呼叫 API）' : '實際執行'}\n`);

  // 載入詞彙
  const vocabulary = JSON.parse(fs.readFileSync(CONFIG.VOCABULARY_PATH, 'utf-8'));
  console.log(`📚 詞彙總數: ${vocabulary.length}`);

  // 篩選有例句的單字
  const wordsWithSentence = vocabulary.filter(w => w.example_sentence?.trim());
  console.log(`📝 有例句的單字: ${wordsWithSentence.length}`);

  // 載入進度
  const progress = loadProgress();
  const completedIds = new Set(progress.completedIds);
  console.log(`✅ 已完成: ${completedIds.size} 筆\n`);

  // 篩選待處理的單字
  let toProcess = wordsWithSentence
    .filter(w => !completedIds.has(w.id))
    .slice(options.start);

  if (options.limit > 0) {
    toProcess = toProcess.slice(0, options.limit);
  }

  console.log(`🎯 本次處理: ${toProcess.length} 筆\n`);

  if (options.dryRun) {
    console.log('📋 預覽模式 - 將處理以下單字：\n');
    toProcess.slice(0, 10).forEach((w, i) => {
      console.log(`   ${i + 1}. [${w.id}] ${w.english_word}`);
      console.log(`      ${w.example_sentence}\n`);
    });
    if (toProcess.length > 10) {
      console.log(`   ... 還有 ${toProcess.length - 10} 筆\n`);
    }
    return;
  }

  // 載入現有結果
  const existingResults = loadExistingResults();
  const resultsMap = new Map(existingResults.map(r => [r.id, r]));

  // 處理每個單字
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const word = toProcess[i];
    const progressStr = `[${i + 1}/${toProcess.length}]`;

    console.log(`${progressStr} 處理: ${word.english_word} (id: ${word.id})`);

    try {
      const result = await callGeminiAPI(word);
      resultsMap.set(word.id, result);
      completedIds.add(word.id);
      successCount++;

      console.log(`   ✅ 成功: ${result.correctAnswer} | 干擾: ${result.distractors.map(d => d.word).join(', ')}`);

      // 每 10 筆儲存一次進度
      if ((i + 1) % 10 === 0) {
        saveProgress({ completedIds: Array.from(completedIds), results: [] });
        const allResults = Array.from(resultsMap.values()).sort((a, b) => a.id - b.id);
        fs.writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(allResults, null, 2));
        console.log(`   💾 已儲存進度 (${i + 1}/${toProcess.length})\n`);
      }
    } catch (error) {
      errorCount++;
      console.log(`   ❌ 失敗: ${error.message}`);
    }

    // Rate limit
    if (i < toProcess.length - 1) {
      await sleep(CONFIG.RATE_LIMIT_DELAY);
    }
  }

  // 最終儲存
  saveProgress({ completedIds: Array.from(completedIds), results: [] });
  const allResults = Array.from(resultsMap.values()).sort((a, b) => a.id - b.id);
  fs.writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(allResults, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('📊 執行結果');
  console.log('='.repeat(50));
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失敗: ${errorCount}`);
  console.log(`   📁 輸出: ${CONFIG.OUTPUT_PATH}`);
  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
