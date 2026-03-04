#!/usr/bin/env node
/**
 * 預生成測驗選項腳本（批次版）
 *
 * 使用方式：
 *   node scripts/generate-quiz-options.mjs [--limit=50] [--start=0] [--stage=國中]
 *
 * 參數：
 *   --limit=N     只處理 N 筆（預設: 50，設為 0 處理全部）
 *   --start=N     從第 N 筆開始（用於斷點續傳）
 *   --stage=國中  只處理指定階段（國中/高中）
 *   --dry-run     只顯示會處理哪些題目，不實際呼叫 API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// === 載入 .env（若存在） ===
const envPath = path.join(PROJECT_ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// === 解析 --stage 參數（用於決定輸出檔名） ===
const stageArg = process.argv.find(a => a.startsWith('--stage='));
const stageSuffix = stageArg ? `-${stageArg.split('=')[1]}` : '';

// === 設定 ===
const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  MODEL: 'gemini-3-flash-preview',
  BATCH_SIZE: 10, // 每次 API 呼叫處理 10 題
  RATE_LIMIT_DELAY: 500, // 0.5 秒間隔
  MAX_RETRIES: 1,
  VOCABULARY_PATH: path.join(PROJECT_ROOT, 'src/data/vocabulary.json'),
  OUTPUT_PATH: path.join(PROJECT_ROOT, `src/data/quiz-options${stageSuffix}.json`),
  PROGRESS_PATH: path.join(PROJECT_ROOT, `scripts/.quiz-options-progress${stageSuffix}.json`),
};

// === System Prompt ===
const SYSTEM_PROMPT = `你是英文測驗出題專家。這是一個「詞彙測驗」，測試學生是否認識正確單字，以及對應的詞形變化、文法、搭配詞和片語。

【最重要規則 - 真實單字】
⚠️ 所有干擾選項必須是「真正存在的英文單字」！
❌ 絕對禁止使用不存在的字：childs, runned, goed, maked, thinked, writed, snakey, goatish, snaked
❌ 絕對禁止自己造字：不可以在單字後面隨意加 -ey, -ish, -ed, -ly 來造新詞
✅ 只能使用真實的字：children, ran, went, made, thought, wrote, snack, shake, coat

【驗證方式 - 每個選項都必須執行】
生成每一個干擾選項後，問自己：「這個字我 100% 確定存在於英文字典中嗎？」
- 100% 確定 → 使用
- 有任何懷疑 → 換一個常見的真實單字

【題目類型判斷】
根據例句和測驗單字，判斷這是哪種題型：
- 單字題：測試單字的正確詞形（時態、單複數、比較級等）
- 搭配詞題：測試動詞+名詞、形容詞+名詞等固定搭配
- 片語題：測試慣用語、片語動詞等

【干擾選項類型 - 從以下類型中選3種】
類型A - 詞形錯誤：同一單字的其他真實詞形（時態、單複數）
類型B - 詞性錯誤：衍生詞但詞性錯誤
類型C - 語意相反：意思相反的真實單字
類型D - 拼寫易混淆：長得像但意思不同的真實單字
類型E - 發音相似：同音或近音異義字
類型F - 搭配錯誤：常見的錯誤搭配

【禁止事項】
1. ❌ 絕對禁止使用不存在的英文單字！（如 maked, runned, childs, snakey, goatish）
2. ❌ 禁止自己造字！不確定的字一律不用，換成常見單字
3. ❌ 禁止使用「語意相近且填進去也通順」的同義詞
4. ❌ 禁止使用「填入後句子仍然正確」的干擾選項`;

// === 工具函數 ===
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { limit: 50, start: 0, dryRun: false, stage: null };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--start=')) {
      options.start = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--stage=')) {
      options.stage = arg.split('=')[1];
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

// === 批次 API 呼叫 ===
async function callGeminiBatchAPI(words, retryCount = 0) {
  const wordsList = words.map((w, i) =>
    `${i + 1}. 例句：${w.example_sentence}\n   測驗單字：${w.english_word}`
  ).join('\n\n');

  const userPrompt = `請為以下 ${words.length} 個單字各生成干擾選項。

${wordsList}

【回傳格式】只回傳 JSON 陣列，不要有其他文字。每個物件必須包含 english_word：
[
  {"english_word": "單字", "questionType": "單字題/搭配詞題/片語題", "correctAnswer": "正確答案", "distractors": [{"word": "干擾1", "type": "A/B/C/D/E/F", "reason": "原因"}, {"word": "干擾2", "type": "A/B/C/D/E/F", "reason": "原因"}, {"word": "干擾3", "type": "A/B/C/D/E/F", "reason": "原因"}], "grammarPoint": "考點"},
  ...
]`;

  try {
    const response = await fetch(
      `${CONFIG.GEMINI_BASE_URL}/models/${CONFIG.MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 16384 }
        })
      }
    );

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

    let results;
    try {
      results = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log(`   📝 原始回應（前 300 字）: ${jsonStr.substring(0, 300)}...`);
      throw parseError;
    }

    if (!Array.isArray(results)) {
      throw new Error('Response is not an array');
    }

    // 用 english_word 配對回原始 word 的 id
    const wordMap = new Map(words.map(w => [w.english_word, w]));
    return results.map((r, i) => {
      // 優先用陣列順序配對，fallback 用 english_word
      const matchedWord = words[i] || wordMap.get(r.english_word);
      return {
        id: matchedWord?.id,
        english_word: r.english_word,
        questionType: r.questionType,
        correctAnswer: r.correctAnswer,
        distractors: r.distractors,
        grammarPoint: r.grammarPoint,
      };
    }).filter(r => r.id != null);
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`   ⚠️  批次重試 ${retryCount + 1}/${CONFIG.MAX_RETRIES}...`);
      await sleep(5000);
      return callGeminiBatchAPI(words, retryCount + 1);
    }
    throw error;
  }
}

// === 主程式 ===
async function main() {
  const options = parseArgs();

  // 檢查 API Key
  if (!CONFIG.GEMINI_API_KEY) {
    console.error('❌ 請設定環境變數 GEMINI_API_KEY');
    console.error('   方法 1: 在專案根目錄建立 .env 檔案，加入 GEMINI_API_KEY=你的key');
    console.error('   方法 2: GEMINI_API_KEY=你的key node scripts/generate-quiz-options.mjs');
    process.exit(1);
  }

  console.log('\n🚀 開始生成測驗選項（批次模式）\n');
  console.log(`   模型: ${CONFIG.MODEL}`);
  console.log(`   批次大小: ${CONFIG.BATCH_SIZE} 題/次`);
  console.log(`   限制: ${options.limit === 0 ? '全部' : options.limit} 筆`);
  console.log(`   起始: 第 ${options.start} 筆`);
  console.log(`   階段: ${options.stage || '全部'}`);
  console.log(`   模式: ${options.dryRun ? '預覽（不呼叫 API）' : '實際執行'}\n`);

  // 載入詞彙
  let vocabulary = JSON.parse(fs.readFileSync(CONFIG.VOCABULARY_PATH, 'utf-8'));
  console.log(`📚 詞彙總數: ${vocabulary.length}`);

  // 篩選階段
  if (options.stage) {
    vocabulary = vocabulary.filter(w => w.stage === options.stage);
    console.log(`🎓 ${options.stage}單字: ${vocabulary.length}`);
  }

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

  const totalBatches = Math.ceil(toProcess.length / CONFIG.BATCH_SIZE);
  console.log(`🎯 本次處理: ${toProcess.length} 筆（${totalBatches} 批）\n`);

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

  // 批次處理
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toProcess.length; i += CONFIG.BATCH_SIZE) {
    const batch = toProcess.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const batchWords = batch.map(w => w.english_word).join(', ');

    console.log(`[批次 ${batchNum}/${totalBatches}] 處理 ${batch.length} 題: ${batchWords}`);

    try {
      const results = await callGeminiBatchAPI(batch);

      for (const result of results) {
        resultsMap.set(result.id, result);
        completedIds.add(result.id);
        successCount++;
      }

      console.log(`   ✅ 成功 ${results.length} 題`);

      // 如果批次回傳數量不足，記錄差異
      if (results.length < batch.length) {
        const missing = batch.length - results.length;
        errorCount += missing;
        console.log(`   ⚠️  缺少 ${missing} 題（下次重跑會補上）`);
      }

      // 每批儲存進度
      saveProgress({ completedIds: Array.from(completedIds), results: [] });
      const allResults = Array.from(resultsMap.values()).sort((a, b) => a.id - b.id);
      fs.writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(allResults, null, 2));
      console.log(`   💾 進度: ${successCount} 題完成\n`);
    } catch (error) {
      errorCount += batch.length;
      console.log(`   ❌ 批次失敗: ${error.message}\n`);
    }

    // Rate limit
    if (i + CONFIG.BATCH_SIZE < toProcess.length) {
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
