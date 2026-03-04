#!/usr/bin/env node
/**
 * 為缺少例句的詞彙生成英文例句
 *
 * 使用方式：
 *   node scripts/generate-example-sentences.mjs                  # 全部處理
 *   node scripts/generate-example-sentences.mjs --limit=20       # 只處理 20 筆
 *   node scripts/generate-example-sentences.mjs --dry-run        # 預覽不呼叫 API
 *
 * 斷點續傳：自動儲存進度，中斷後重跑會從上次的位置繼續。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// === 載入 .env ===
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

// === 設定 ===
const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  MODEL: 'gemini-2.5-flash',
  BATCH_SIZE: 20,           // 每次 API 呼叫處理 20 筆
  RATE_LIMIT_DELAY: 1000,   // 1 秒間隔
  MAX_RETRIES: 2,
  VOCABULARY_PATH: path.join(PROJECT_ROOT, 'src/data/vocabulary.json'),
  PROGRESS_PATH: path.join(PROJECT_ROOT, 'scripts/.example-sentences-progress.json'),
};

const SYSTEM_PROMPT = `你是英文教學專家，專門為台灣高中生編寫英文例句。

【任務】
為每個英文單字生成一個自然、實用的英文例句，以及對應的繁體中文翻譯。

【例句要求】
1. 長度：10～25 個英文單字，不要太長也不要太短
2. 難度：適合台灣高中生程度（CEFR A2-B2）
3. 內容：貼近日常生活、學校、旅遊、科技等高中生能理解的情境
4. 文法：正確、自然的英文，避免過於複雜的句型
5. 單字本身必須原形出現在例句中（不是變形）
   - ✅ "revive" → "The doctor tried to revive the patient."
   - ❌ "revive" → "The patient was revived by the doctor." （被動式，不是原形）
   - 例外：名詞可以用複數形，動詞如果語境需要也可以用時態變化
6. 專有名詞（人名、地名等）：寫一個包含該名詞的自然句子
   - "Cincinnati" → "Cincinnati is a large city in the state of Ohio."
7. 片語/搭配詞：整個片語必須出現在例句中
   - "rush hour" → "Traffic is always heavy during rush hour."

【回傳格式】
只回傳 JSON 陣列，不要有其他文字：
[
  {"id": 數字, "example_sentence": "英文例句", "example_translation": "中文翻譯"},
  ...
]`;

// === 工具函數 ===
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { limit: 0, dryRun: false };
  for (const arg of args) {
    if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1], 10);
    else if (arg === '--dry-run') options.dryRun = true;
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
    console.warn('⚠️  無法讀取進度，從頭開始');
  }
  return { completedIds: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(CONFIG.PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// === Gemini API 呼叫 ===
async function callGeminiAPI(words, retryCount = 0) {
  const wordsList = words.map((w, i) =>
    `${i + 1}. ID=${w.id} | 單字：${w.english_word} | 中文：${w.chinese_definition || '(無)'} | 詞性：${w.posOriginal || '(無)'}`
  ).join('\n');

  const userPrompt = `請為以下 ${words.length} 個單字各生成一個英文例句和中文翻譯。

${wordsList}

記住：只回傳 JSON 陣列，每個物件必須包含 id, example_sentence, example_translation。`;

  try {
    const response = await fetch(
      `${CONFIG.GEMINI_BASE_URL}/models/${CONFIG.MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
        }),
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

    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let results;
    try {
      results = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log(`   📝 原始回應（前 500 字）: ${jsonStr.substring(0, 500)}...`);
      throw parseError;
    }

    if (!Array.isArray(results)) {
      throw new Error('Response is not an array');
    }

    return results;
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`   ⚠️  重試 (${retryCount + 1}/${CONFIG.MAX_RETRIES}): ${error.message}`);
      await sleep(3000 * (retryCount + 1));
      return callGeminiAPI(words, retryCount + 1);
    }
    throw error;
  }
}

// === 主程式 ===
async function main() {
  const options = parseArgs();

  console.log('\n' + '='.repeat(60));
  console.log('  為缺少例句的詞彙生成英文例句');
  console.log('='.repeat(60));

  if (!CONFIG.GEMINI_API_KEY) {
    console.error('❌ 缺少 GEMINI_API_KEY，請在 .env 檔案中設定');
    process.exit(1);
  }

  // 載入資料
  const vocab = JSON.parse(fs.readFileSync(CONFIG.VOCABULARY_PATH, 'utf-8'));
  const vocabMap = new Map(vocab.map((v, i) => [v.id, i]));

  // 找出缺少例句的詞彙
  const needSentence = vocab.filter(v =>
    !v.example_sentence || !v.example_sentence.trim()
  );

  console.log(`\n   詞彙總數: ${vocab.length}`);
  console.log(`   缺少例句: ${needSentence.length}`);

  // 載入進度
  const progress = loadProgress();
  const completedSet = new Set(progress.completedIds);
  const todo = needSentence.filter(v => !completedSet.has(v.id));

  console.log(`   已完成: ${completedSet.size}`);
  console.log(`   待處理: ${todo.length}`);

  if (todo.length === 0) {
    console.log('\n   ✅ 全部完成！');
    return;
  }

  // 限制數量
  const target = options.limit > 0 ? todo.slice(0, options.limit) : todo;
  console.log(`   本次目標: ${target.length}\n`);

  if (options.dryRun) {
    console.log('   [DRY RUN] 預覽前 10 筆:');
    target.slice(0, 10).forEach(v => {
      console.log(`   [${v.id}] ${v.english_word} (${v.chinese_definition || '?'})`);
    });
    return;
  }

  // 批次處理
  const batches = [];
  for (let i = 0; i < target.length; i += CONFIG.BATCH_SIZE) {
    batches.push(target.slice(i, i + CONFIG.BATCH_SIZE));
  }

  let totalSuccess = 0;
  let totalFail = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const batchStart = b * CONFIG.BATCH_SIZE + 1;
    const batchEnd = batchStart + batch.length - 1;

    process.stdout.write(`   [${b + 1}/${batches.length}] 處理 #${batchStart}-${batchEnd} (${batch.map(w => w.english_word).slice(0, 3).join(', ')}...)  `);

    try {
      const results = await callGeminiAPI(batch);

      // 寫入 vocabulary.json
      let matched = 0;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        // 配對：優先用 id，fallback 用陣列順序
        const targetId = r.id || batch[i]?.id;
        const vocabIdx = vocabMap.get(targetId);

        if (vocabIdx === undefined) continue;
        if (!r.example_sentence || !r.example_sentence.trim()) continue;

        vocab[vocabIdx].example_sentence = r.example_sentence.trim();
        vocab[vocabIdx].example_translation = (r.example_translation || '').trim();

        progress.completedIds.push(targetId);
        matched++;
      }

      totalSuccess += matched;
      console.log(`✅ ${matched}/${batch.length} 筆成功`);

      // 每批次都存檔（斷點續傳）
      saveProgress(progress);
      fs.writeFileSync(CONFIG.VOCABULARY_PATH, JSON.stringify(vocab, null, 2) + '\n');

    } catch (error) {
      totalFail += batch.length;
      console.log(`❌ 失敗: ${error.message}`);
      // 記錄失敗的 batch 但繼續下一批
    }

    // Rate limiting
    if (b < batches.length - 1) {
      await sleep(CONFIG.RATE_LIMIT_DELAY);
    }
  }

  // === 總結 ===
  console.log('\n' + '='.repeat(60));
  console.log('📊 生成結果');
  console.log('='.repeat(60));
  console.log(`   成功: ${totalSuccess}`);
  console.log(`   失敗: ${totalFail}`);
  console.log(`   累計完成: ${progress.completedIds.length} / ${needSentence.length}`);

  if (totalFail > 0) {
    console.log(`\n   ⚠️  有 ${totalFail} 筆失敗，重新執行腳本會自動跳過已完成的`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('❌ 未預期錯誤:', err);
  process.exit(1);
});
