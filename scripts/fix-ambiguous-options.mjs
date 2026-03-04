#!/usr/bin/env node
/**
 * 修正模棱兩可的測驗選項（填入後句子仍然正確的干擾選項）
 * 只針對 15 筆有問題的 ID 重新生成
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// 載入 .env
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

const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  MODEL: 'gemini-2.5-flash',
  VOCABULARY_PATH: path.join(PROJECT_ROOT, 'src/data/vocabulary.json'),
  QUIZ_OPTIONS_PATH: path.join(PROJECT_ROOT, 'src/data/quiz-options.json'),
};

// 需要修正的 ID（服裝 + 運動 + 房間 + 三餐 + 季節 + 顏色）
const FIX_IDS = [
  1214, 3248, 3758, 4797, 12327, 3253, 3756, 4818, // shirt ↔ skirt
  158, 4099, 2350, 2370,                             // basketball ↔ baseball, badminton ↔ tennis
  4102, 4111, 12451,                                  // bathroom ↔ bedroom, classroom ↔ bedroom
  188, 4153,                                          // dinner ↔ breakfast
  4851,                                               // spring → winter
  4158,                                               // brown → blue
];

const SYSTEM_PROMPT = `你是英文測驗出題專家。這是一個「詞彙測驗」，測試學生是否認識正確單字。

【最重要規則 - 真實單字】
所有干擾選項必須是「真正存在的英文單字」！

【最重要禁止事項 - 填入後也正確的選項】
⚠️ 這些題目之前生成的干擾選項有問題：填入後句子仍然正確！

❌ 絕對禁止使用「同類別詞」當干擾選項！具體禁止：
- 服裝類：shirt 不能用 skirt/pants/dress，skirt 不能用 shirt/dress/pants
- 運動類：basketball 不能用 baseball/soccer/tennis，badminton 不能用 tennis/baseball
- 房間類：bathroom 不能用 bedroom/kitchen，bedroom 不能用 bathroom，classroom 不能用 bedroom
- 三餐類：dinner 不能用 breakfast/lunch，breakfast 不能用 dinner/lunch
- 季節類：spring 不能用 summer/fall/winter
- 顏色類：brown 不能用 blue/red/green 等其他顏色
❌ 任何填入後句子仍然正確的詞都不能用

✅ 正確做法：使用拼寫相似但不同類別的詞、發音相似的詞、詞形變化等

✅ 正確做法：使用詞形變化(aunts)、拼寫相似(ant)、發音相似(aren't)、詞性錯誤等

【干擾選項類型 - 從以下類型中選3種不同類型】
類型A - 詞形錯誤：同一單字的其他真實詞形（時態、單複數）
類型B - 詞性錯誤：衍生詞但詞性錯誤
類型D - 拼寫易混淆：長得像但意思不同的真實單字
類型E - 發音相似：同音或近音異義字

⚠️ 這次不要使用類型C（語意相反），因為這些詞的反義詞填入後句子仍然正確。

【回傳格式】只回傳 JSON 陣列，不要有其他文字：
[{"english_word": "單字", "questionType": "單字題", "correctAnswer": "正確答案", "distractors": [{"word": "干擾1", "type": "A/B/D/E/F", "reason": "原因"}, ...], "grammarPoint": "考點"}]`;

async function callGeminiAPI(words) {
  const wordsList = words.map((w, i) =>
    `${i + 1}. 例句：${w.example_sentence}\n   測驗單字：${w.english_word}`
  ).join('\n\n');

  const userPrompt = `請為以下 ${words.length} 個單字各生成 3 個干擾選項。

${wordsList}

重要提醒：這些題目之前的干擾選項因為用了同類別詞而被判定為「填入後也正確」。
例如 shirt 用了 skirt、basketball 用了 baseball、dinner 用了 breakfast。
這次請避免使用任何同類別的詞當干擾，改用拼寫相似（但不同類別）、發音相似、詞形變化等類型。`;

  const response = await fetch(
    `${CONFIG.GEMINI_BASE_URL}/models/${CONFIG.MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`API Error ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response');

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

async function main() {
  if (!CONFIG.GEMINI_API_KEY) {
    console.error('❌ 缺少 GEMINI_API_KEY');
    process.exit(1);
  }

  // 載入詞彙和現有選項
  const vocabulary = JSON.parse(fs.readFileSync(CONFIG.VOCABULARY_PATH, 'utf-8'));
  const quizOptions = JSON.parse(fs.readFileSync(CONFIG.QUIZ_OPTIONS_PATH, 'utf-8'));

  // 找出需要修正的詞彙
  const vocabMap = new Map(vocabulary.map(v => [v.id, v]));
  const wordsToFix = FIX_IDS.map(id => vocabMap.get(id)).filter(Boolean);

  console.log(`\n🔧 修正 ${wordsToFix.length} 筆模棱兩可的測驗選項\n`);
  console.log(`   模型: ${CONFIG.MODEL}`);
  console.log(`   修正 ID: ${FIX_IDS.join(', ')}\n`);

  for (const w of wordsToFix) {
    console.log(`   - [${w.id}] ${w.english_word}: ${w.example_sentence?.substring(0, 50)}...`);
  }

  // 分批呼叫 API（每批 10 筆）
  const BATCH_SIZE = 10;
  const allResults = [];
  for (let i = 0; i < wordsToFix.length; i += BATCH_SIZE) {
    const batch = wordsToFix.slice(i, i + BATCH_SIZE);
    console.log(`\n📡 呼叫 Gemini API（批次 ${Math.floor(i / BATCH_SIZE) + 1}，${batch.length} 筆）...\n`);
    const results = await callGeminiAPI(batch);
    console.log(`✅ 收到 ${results.length} 筆結果`);
    allResults.push(...results.map((r, idx) => ({ result: r, word: batch[idx] })));
    if (i + BATCH_SIZE < wordsToFix.length) {
      console.log('   ⏳ 等待 2 秒...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n✅ 總共收到 ${allResults.length} 筆結果\n`);

  // 建立結果對照表
  const resultMap = new Map();
  allResults.forEach(({ result, word }) => {
    if (word) {
      resultMap.set(word.id, result);
    }
  });

  // 更新 quiz-options.json
  let updatedCount = 0;
  const updatedOptions = quizOptions.map(opt => {
    if (resultMap.has(opt.id)) {
      const newResult = resultMap.get(opt.id);
      console.log(`   ✏️  [${opt.id}] ${opt.english_word}:`);
      console.log(`      舊干擾: ${opt.distractors.map(d => d.word).join(', ')}`);
      console.log(`      新干擾: ${newResult.distractors.map(d => d.word).join(', ')}`);
      updatedCount++;
      return {
        ...opt,
        questionType: newResult.questionType || opt.questionType,
        correctAnswer: newResult.correctAnswer || opt.correctAnswer,
        distractors: newResult.distractors,
        grammarPoint: newResult.grammarPoint || opt.grammarPoint,
      };
    }
    return opt;
  });

  // 寫入
  fs.writeFileSync(CONFIG.QUIZ_OPTIONS_PATH, JSON.stringify(updatedOptions, null, 2) + '\n');
  console.log(`\n💾 已更新 ${updatedCount} 筆到 quiz-options.json`);
  console.log('✅ 完成！\n');
}

main().catch(err => {
  console.error('❌ 錯誤:', err.message);
  process.exit(1);
});
