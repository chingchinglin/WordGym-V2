#!/usr/bin/env node
/**
 * 補跑 batch 6 失敗的 10 題（用較小批次 + gemini-2.5-flash）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// Load .env
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

const API_KEY = process.env.GEMINI_API_KEY;
const vocab = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'src/data/vocabulary.json'), 'utf-8'));
const ids = [10194, 10195, 10196, 10197, 10198, 10199, 10200, 10201, 10202, 10203];
const words = ids.map(id => vocab.find(v => v.id === id));

const SYSTEM_PROMPT = `你是英文測驗出題專家。為每個單字生成3個干擾選項。
所有干擾選項必須是真正存在的英文單字。回答盡量簡短精要。`;

async function processBatch(batch) {
  const wordsList = batch.map((w, i) =>
    `${i + 1}. 例句：${w.example_sentence}\n   測驗單字：${w.english_word}`
  ).join('\n\n');

  const userPrompt = `為以下 ${batch.length} 個單字生成干擾選項。reason 請控制在 15 字以內。
${wordsList}
回傳 JSON：[{"english_word":"字","questionType":"單字題/搭配詞題/片語題","correctAnswer":"答案","distractors":[{"word":"干擾","type":"A-F","reason":"原因"}],"grammarPoint":"考點"}]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`API ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response');

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

// Process in 2 batches of 5
const outputPath = path.join(PROJECT_ROOT, 'src/data/quiz-options-高中.json');
const progressPath = path.join(PROJECT_ROOT, 'scripts/.quiz-options-progress-高中.json');

for (let i = 0; i < words.length; i += 5) {
  const batch = words.slice(i, i + 5);
  console.log(`Processing: ${batch.map(w => w.english_word).join(', ')}`);

  try {
    const results = await processBatch(batch);
    console.log(`  Got ${results.length} results`);

    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    const existingMap = new Map(existing.map(r => [r.id, r]));

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const word = batch[j];
      existingMap.set(word.id, {
        id: word.id,
        english_word: r.english_word,
        questionType: r.questionType,
        correctAnswer: r.correctAnswer,
        distractors: r.distractors,
        grammarPoint: r.grammarPoint,
      });
      console.log(`  ✅ [${word.id}] ${r.english_word}`);
    }

    const allResults = Array.from(existingMap.values()).sort((a, b) => a.id - b.id);
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

    // Update progress
    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    for (const w of batch) {
      if (!progress.completedIds.includes(w.id)) {
        progress.completedIds.push(w.id);
      }
    }
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.log(`  ❌ Failed: ${err.message}`);
  }

  if (i + 5 < words.length) await new Promise(r => setTimeout(r, 1000));
}

console.log('\nDone!');
