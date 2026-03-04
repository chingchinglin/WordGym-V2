#!/usr/bin/env node
/**
 * 測驗選項深層品質驗證
 *
 * 驗證項目：
 *   1. 填空渲染驗證 — correctAnswer 能否在例句中找到匹配
 *   2. correctAnswer 與 vocabulary 對齊
 *   3. 片語題專項驗證（片語題 + 搭配詞題）
 *   4. ID 覆蓋率分析
 *
 * 使用方式：
 *   node scripts/validate-quiz-deep.mjs
 *   node scripts/validate-quiz-deep.mjs --verbose    (顯示所有失敗的詳細資訊)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const QUIZ_PATH = path.join(PROJECT_ROOT, 'src/data/quiz-options.json');
const VOCAB_PATH = path.join(PROJECT_ROOT, 'src/data/vocabulary.json');

const verbose = process.argv.includes('--verbose');

// ============================================================
// makeCloze 邏輯的 Node.js 移植（來自 src/utils/quizHelpers.ts）
// ============================================================

const escapeForRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getBaseWord = (word) => word.split('(')[0].trim();

const IRREGULAR_VERBS = {
  become: ['became', 'becoming'],
  begin: ['began', 'begun', 'beginning'],
  find: ['found', 'finding'],
  hide: ['hid', 'hidden', 'hiding'],
  light: ['lit', 'lighted', 'lighting'],
  write: ['wrote', 'written', 'writing'],
  speak: ['spoke', 'spoken', 'speaking'],
  break: ['broke', 'broken', 'breaking'],
  choose: ['chose', 'chosen', 'choosing'],
  drive: ['drove', 'driven', 'driving'],
  eat: ['ate', 'eaten', 'eating'],
  fall: ['fell', 'fallen', 'falling'],
  give: ['gave', 'given', 'giving'],
  know: ['knew', 'known', 'knowing'],
  ride: ['rode', 'ridden', 'riding'],
  see: ['saw', 'seen', 'seeing'],
  take: ['took', 'taken', 'taking'],
  go: ['went', 'gone', 'going'],
  do: ['did', 'done', 'doing'],
  have: ['had', 'having'],
  make: ['made', 'making'],
  come: ['came', 'coming'],
  run: ['ran', 'running'],
  sit: ['sat', 'sitting'],
  stand: ['stood', 'standing'],
  understand: ['understood', 'understanding'],
  teach: ['taught', 'teaching'],
  catch: ['caught', 'catching'],
  bring: ['brought', 'bringing'],
  buy: ['bought', 'buying'],
  think: ['thought', 'thinking'],
  fight: ['fought', 'fighting'],
  seek: ['sought', 'seeking'],
  feel: ['felt', 'feeling'],
  keep: ['kept', 'keeping'],
  leave: ['left', 'leaving'],
  lose: ['lost', 'losing'],
  meet: ['met', 'meeting'],
  pay: ['paid', 'paying'],
  say: ['said', 'saying'],
  sell: ['sold', 'selling'],
  send: ['sent', 'sending'],
  spend: ['spent', 'spending'],
  tell: ['told', 'telling'],
  win: ['won', 'winning'],
  build: ['built', 'building'],
  hear: ['heard', 'hearing'],
  hold: ['held', 'holding'],
  read: ['read', 'reading'],
  sleep: ['slept', 'sleeping'],
  wear: ['wore', 'worn', 'wearing'],
  bear: ['bore', 'born', 'bearing'],
  tear: ['tore', 'torn', 'tearing'],
  swim: ['swam', 'swum', 'swimming'],
  sing: ['sang', 'sung', 'singing'],
  drink: ['drank', 'drunk', 'drinking'],
  ring: ['rang', 'rung', 'ringing'],
  sink: ['sank', 'sunk', 'sinking'],
  spring: ['sprang', 'sprung', 'springing'],
  grow: ['grew', 'grown', 'growing'],
  throw: ['threw', 'thrown', 'throwing'],
  blow: ['blew', 'blown', 'blowing'],
  fly: ['flew', 'flown', 'flying'],
  draw: ['drew', 'drawn', 'drawing'],
  withdraw: ['withdrew', 'withdrawn', 'withdrawing'],
  freeze: ['froze', 'frozen', 'freezing'],
  lend: ['lent', 'lending'],
  shake: ['shook', 'shaken', 'shaking'],
  shine: ['shone', 'shined', 'shining'],
  shrink: ['shrank', 'shrunk', 'shrunken', 'shrinking'],
  creep: ['crept', 'creeping'],
  flee: ['fled', 'fleeing'],
  overtake: ['overtook', 'overtaken', 'overtaking'],
  cling: ['clung', 'clinging'],
  spin: ['spun', 'spinning'],
  spit: ['spat', 'spit', 'spitting'],
  weep: ['wept', 'weeping'],
  stride: ['strode', 'stridden', 'striding'],
  weave: ['wove', 'woven', 'weaving'],
  bind: ['bound', 'binding'],
  slay: ['slew', 'slain', 'slaying'],
  grind: ['ground', 'grinding'],
  bite: ['bit', 'bitten', 'biting'],
  slide: ['slid', 'sliding'],
  dig: ['dug', 'digging'],
  hang: ['hung', 'hanged', 'hanging'],
  sweep: ['swept', 'sweeping'],
  strike: ['struck', 'stricken', 'striking'],
  be: ['is', 'am', 'are', 'was', 'were', 'been', 'being'],
  lead: ['led', 'leading'],
  spread: ['spread', 'spreading'],
  set: ['set', 'setting'],
  shut: ['shut', 'shutting'],
  cut: ['cut', 'cutting'],
  put: ['put', 'putting'],
  hit: ['hit', 'hitting'],
  let: ['let', 'letting'],
  hurt: ['hurt', 'hurting'],
  cost: ['cost', 'costing'],
  quit: ['quit', 'quitting'],
  lay: ['laid', 'laying'],
  lie: ['lay', 'lain', 'lying'],
  rise: ['rose', 'risen', 'rising'],
  wake: ['woke', 'woken', 'waking'],
  steal: ['stole', 'stolen', 'stealing'],
  forget: ['forgot', 'forgotten', 'forgetting'],
  forgive: ['forgave', 'forgiven', 'forgiving'],
  prove: ['proved', 'proven', 'proving'],
  show: ['showed', 'shown', 'showing'],
  swear: ['swore', 'sworn', 'swearing'],
  stick: ['stuck', 'sticking'],
  sting: ['stung', 'stinging'],
  swing: ['swung', 'swinging'],
  deal: ['dealt', 'dealing'],
  feed: ['fed', 'feeding'],
  mean: ['meant', 'meaning'],
  shoot: ['shot', 'shooting'],
  bend: ['bent', 'bending'],
  burst: ['burst', 'bursting'],
  mimic: ['mimicked', 'mimicking'],
};

const IRREGULAR_NOUNS = {
  leaf: ['leaves'],
  wolf: ['wolves'],
  tooth: ['teeth'],
  foot: ['feet'],
  goose: ['geese'],
  mouse: ['mice'],
  child: ['children'],
  man: ['men'],
  woman: ['women'],
  person: ['people', 'persons'],
  life: ['lives'],
  wife: ['wives'],
  knife: ['knives'],
  half: ['halves'],
  shelf: ['shelves'],
  self: ['selves'],
  calf: ['calves'],
  thief: ['thieves'],
  loaf: ['loaves'],
  ox: ['oxen'],
  criterion: ['criteria'],
  phenomenon: ['phenomena'],
  medium: ['media'],
  datum: ['data'],
  analysis: ['analyses'],
  crisis: ['crises'],
  basis: ['bases'],
  thesis: ['theses'],
  hypothesis: ['hypotheses'],
  stimulus: ['stimuli'],
  focus: ['foci', 'focuses'],
  fungus: ['fungi', 'funguses'],
  cactus: ['cacti', 'cactuses'],
};

function getWordForms(word) {
  const base = getBaseWord(word).toLowerCase();
  const forms = [base];

  forms.push(base + 's');
  forms.push(base + 'es');
  forms.push(base + 'ed');
  forms.push(base + 'ing');
  forms.push(base + 'd');

  if (base.endsWith('e')) {
    forms.push(base.slice(0, -1) + 'ing');
    forms.push(base + 'd');
  }

  if (/[aeiou][bcdfghlmnprstvwz]$/.test(base)) {
    const doubled = base + base.slice(-1);
    forms.push(doubled + 'ed');
    forms.push(doubled + 'ing');
  }

  if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
    forms.push(base.slice(0, -1) + 'ies');
    forms.push(base.slice(0, -1) + 'ied');
  }

  forms.push(base + 'er');
  forms.push(base + 'est');
  forms.push(base + 'ly');

  if (base.endsWith('al')) {
    forms.push(base.slice(0, -2) + 'e');
    forms.push(base.slice(0, -2));
  }
  if (base.endsWith('ment')) {
    forms.push(base.slice(0, -4));
  }
  if (base.endsWith('tion')) {
    forms.push(base.slice(0, -3) + 'e');
    forms.push(base.slice(0, -4));
  }
  if (base.endsWith('sion')) {
    forms.push(base.slice(0, -3) + 'e');
    forms.push(base.slice(0, -4));
  }
  if (base.endsWith('ness')) {
    forms.push(base.slice(0, -4));
    forms.push(base.slice(0, -4) + 'y');
  }
  if (base.endsWith('ence')) {
    forms.push(base.slice(0, -3) + 't');
  }
  if (base.endsWith('ance')) {
    forms.push(base.slice(0, -3) + 't');
  }
  if (base.endsWith('ly')) {
    forms.push(base.slice(0, -2));
    if (base.endsWith('ily')) {
      forms.push(base.slice(0, -3) + 'y');
    }
  }
  if (base.endsWith('ing')) {
    forms.push(base.slice(0, -3));
    forms.push(base.slice(0, -3) + 'e');
    forms.push(base.slice(0, -3) + 'ed');
  }
  if (base.endsWith('ive')) {
    const verbRoot = base.slice(0, -3);
    forms.push(verbRoot);
    forms.push(verbRoot + 'ed');
    forms.push(verbRoot + 'ing');
    forms.push(verbRoot + 'es');
    forms.push(base.slice(0, -2) + 'e');
    forms.push(base.slice(0, -2) + 'ed');
    forms.push(base.slice(0, -2) + 'ing');
  }
  if (base.endsWith('ful')) {
    forms.push(base.slice(0, -3));
    forms.push(base.slice(0, -3) + 's');
    forms.push(base.slice(0, -3) + 'd');
    forms.push(base.slice(0, -3) + 'ing');
  }
  if (base.endsWith('able') || base.endsWith('ible')) {
    const root = base.slice(0, -4);
    forms.push(root);
    forms.push(root + 'y');
    forms.push(root + 'e');
    forms.push(root + 'ed');
  }

  if (IRREGULAR_VERBS[base]) {
    forms.push(...IRREGULAR_VERBS[base]);
  }
  for (const [root, irregulars] of Object.entries(IRREGULAR_VERBS)) {
    if (irregulars.includes(base)) {
      forms.push(root);
      forms.push(...irregulars);
    }
  }

  if (IRREGULAR_NOUNS[base]) {
    forms.push(...IRREGULAR_NOUNS[base]);
  }
  for (const [singular, plurals] of Object.entries(IRREGULAR_NOUNS)) {
    if (plurals.includes(base)) {
      forms.push(singular);
      forms.push(...plurals);
    }
  }

  return [...new Set(forms)];
}

function isPhrase(text) {
  return /\s+/.test(text.trim());
}

function getPhraseWordForms(phrase) {
  const words = phrase.trim().split(/\s+/);
  if (words.length <= 1) return getWordForms(phrase);
  const lastWord = words[words.length - 1];
  const otherWords = words.slice(0, -1);
  const lastWordForms = getWordForms(lastWord);
  return lastWordForms.map((form) => [...otherWords, form].join(' '));
}

/**
 * 模擬前端的 makeCloze()，回傳 true 表示能正常挖空（非 fallback）
 */
function canMakeCloze(sentence, answer) {
  if (!sentence || !answer) return false;

  const baseWord = getBaseWord(answer);
  const isMultiWord = isPhrase(baseWord);

  if (isMultiWord) {
    const phraseWordForms = getPhraseWordForms(baseWord);

    // 嘗試整個片語匹配
    for (const phraseForm of phraseWordForms) {
      const phraseEsc = escapeForRegex(phraseForm);
      const phraseRx = new RegExp(`(^|[^A-Za-z])(${phraseEsc})(?=[^A-Za-z]|$)`, 'i');
      if (phraseRx.test(sentence)) return true;
    }

    // 嘗試片語中的個別字
    const words = baseWord.split(/\s+/);
    for (const word of words) {
      const wordEsc = escapeForRegex(word);
      const wordRx = new RegExp(`(^|[^A-Za-z])(${wordEsc})(?=[^A-Za-z]|$)`, 'i');
      if (wordRx.test(sentence)) return true;
    }

    return false;
  }

  // 單字處理
  const esc = escapeForRegex(baseWord);
  const exactRx = new RegExp(`(^|[^A-Za-z])(${esc})(?=[^A-Za-z]|$)`, 'i');
  if (exactRx.test(sentence)) return true;

  // 嘗試詞形變化
  const wordForms = getWordForms(baseWord);
  for (const form of wordForms) {
    const formEsc = escapeForRegex(form);
    const formRx = new RegExp(`(^|[^A-Za-z])(${formEsc})(?=[^A-Za-z]|$)`, 'i');
    if (formRx.test(sentence)) return true;
  }

  // Fallback: 前綴匹配（3+ 字元）
  if (baseWord.length >= 3) {
    const prefixRx = new RegExp(`(^|[^A-Za-z])(${esc}[a-z]*)(?=[^A-Za-z]|$)`, 'i');
    if (prefixRx.test(sentence)) return true;
  }

  return false;
}

// ============================================================
// 載入資料
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('  測驗選項深層品質驗證');
console.log('='.repeat(70));

console.log('\n📂 載入資料...');
const quizData = JSON.parse(fs.readFileSync(QUIZ_PATH, 'utf-8'));
const vocabData = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const vocabMap = new Map(vocabData.map(w => [w.id, w]));

console.log(`   測驗選項: ${quizData.length} 題`);
console.log(`   詞彙資料: ${vocabData.length} 筆`);

// ============================================================
// 檢查 1：填空渲染驗證
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('🔍 檢查 1：填空渲染驗證（correctAnswer 能否在例句中正常挖空）');
console.log('='.repeat(70));

const clozeFailures = [];
let clozePass = 0;
let clozeNoSentence = 0;

for (const item of quizData) {
  const vocab = vocabMap.get(item.id);
  if (!vocab) continue;

  // 收集所有可用例句
  const sentences = [
    vocab.example_sentence,
    vocab.example_sentence_2,
    vocab.example_sentence_3,
    vocab.example_sentence_4,
    vocab.example_sentence_5,
  ].filter(s => s && s.trim());

  if (sentences.length === 0) {
    clozeNoSentence++;
    continue;
  }

  // 只要任何一個例句能匹配就算通過
  const anyMatch = sentences.some(s => canMakeCloze(s, item.correctAnswer));

  if (anyMatch) {
    clozePass++;
  } else {
    clozeFailures.push({
      id: item.id,
      word: item.english_word,
      type: item.questionType,
      correctAnswer: item.correctAnswer,
      sentence: sentences[0].slice(0, 80),
    });
  }
}

const clozeTotal = clozePass + clozeFailures.length;
const clozePct = (clozePass / clozeTotal * 100).toFixed(1);

console.log(`\n   有例句的題目: ${clozeTotal}`);
console.log(`   無例句（跳過）: ${clozeNoSentence}`);
console.log(`   ✅ 能正常挖空: ${clozePass} / ${clozeTotal} (${clozePct}%)`);
console.log(`   ❌ 會 fallback 到句尾 (_____): ${clozeFailures.length}`);

if (clozeFailures.length > 0) {
  // 按題型分組統計
  const failByType = {};
  for (const f of clozeFailures) {
    failByType[f.type] = (failByType[f.type] || 0) + 1;
  }
  console.log('\n   按題型分佈:');
  for (const [type, count] of Object.entries(failByType).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${type}: ${count}`);
  }

  const showCount = verbose ? clozeFailures.length : Math.min(20, clozeFailures.length);
  console.log(`\n   失敗清單 (${verbose ? '全部' : '前 20'}):` );
  clozeFailures.slice(0, showCount).forEach(f => {
    console.log(`   [${f.id}] ${f.word} (${f.type})`);
    console.log(`     correctAnswer: "${f.correctAnswer}"`);
    console.log(`     例句: "${f.sentence}..."`);
  });
  if (!verbose && clozeFailures.length > 20) {
    console.log(`   ... 還有 ${clozeFailures.length - 20} 題（使用 --verbose 顯示全部）`);
  }
}

// ============================================================
// 檢查 2：correctAnswer 與 vocabulary 對齊
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('🔍 檢查 2：correctAnswer 與 vocabulary.english_word 對齊');
console.log('='.repeat(70));

const alignExact = [];        // 完全一致
const alignWordForm = [];     // 是合理的詞形變化
const alignPartial = [];      // 片語取部分
const alignMismatch = [];     // 真正不一致

for (const item of quizData) {
  const vocab = vocabMap.get(item.id);
  if (!vocab) continue;

  const correct = item.correctAnswer.trim().toLowerCase();
  const vocabWord = vocab.english_word.trim().toLowerCase();

  if (correct === vocabWord) {
    alignExact.push(item);
    continue;
  }

  // 片語/搭配詞：correctAnswer 可能只是片語的一部分
  if (item.questionType === '片語題' || item.questionType === '搭配詞題') {
    // correctAnswer 是 english_word 的子串，或反過來
    if (vocabWord.includes(correct) || correct.includes(vocabWord)) {
      alignPartial.push(item);
      continue;
    }
  }

  // 檢查是否為合理的詞形變化
  const vocabForms = getWordForms(vocabWord);
  if (vocabForms.includes(correct)) {
    alignWordForm.push(item);
    continue;
  }

  // correctAnswer 的詞形是否包含 vocabWord
  const correctForms = getWordForms(correct);
  if (correctForms.includes(vocabWord)) {
    alignWordForm.push(item);
    continue;
  }

  // 片語中的個別字匹配
  const vocabWords = vocabWord.split(/\s+/);
  const correctWords = correct.split(/\s+/);
  const anyWordMatch = correctWords.some(cw =>
    vocabWords.some(vw => vw === cw || getWordForms(vw).includes(cw))
  );
  if (anyWordMatch) {
    alignPartial.push(item);
    continue;
  }

  alignMismatch.push({
    id: item.id,
    type: item.questionType,
    correctAnswer: item.correctAnswer,
    vocabWord: vocab.english_word,
  });
}

const alignTotal = alignExact.length + alignWordForm.length + alignPartial.length + alignMismatch.length;
console.log(`\n   完全一致:       ${alignExact.length} (${(alignExact.length / alignTotal * 100).toFixed(1)}%)`);
console.log(`   合理詞形變化:   ${alignWordForm.length} (${(alignWordForm.length / alignTotal * 100).toFixed(1)}%)`);
console.log(`   片語取部分字:   ${alignPartial.length} (${(alignPartial.length / alignTotal * 100).toFixed(1)}%)`);
console.log(`   ❌ 真正不一致:  ${alignMismatch.length} (${(alignMismatch.length / alignTotal * 100).toFixed(1)}%)`);

if (alignMismatch.length > 0) {
  const showCount = verbose ? alignMismatch.length : Math.min(30, alignMismatch.length);
  console.log(`\n   不一致清單 (${verbose ? '全部' : '前 30'}):` );
  alignMismatch.slice(0, showCount).forEach(m => {
    console.log(`   [${m.id}] (${m.type}) correctAnswer="${m.correctAnswer}" vs vocab="${m.vocabWord}"`);
  });
  if (!verbose && alignMismatch.length > 30) {
    console.log(`   ... 還有 ${alignMismatch.length - 30} 題`);
  }
}

// ============================================================
// 檢查 3：片語題 + 搭配詞題專項驗證
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('🔍 檢查 3：片語題 + 搭配詞題專項驗證');
console.log('='.repeat(70));

const phraseItems = quizData.filter(q => q.questionType === '片語題' || q.questionType === '搭配詞題');
console.log(`\n   片語題: ${quizData.filter(q => q.questionType === '片語題').length}`);
console.log(`   搭配詞題: ${quizData.filter(q => q.questionType === '搭配詞題').length}`);
console.log(`   合計: ${phraseItems.length}`);

// 3a. correctAnswer 與 english_word 的關係模式
const phrasePatterns = {
  exact: [],         // correctAnswer === english_word
  partOfPhrase: [],  // correctAnswer 是片語的一部分
  wordForm: [],      // 是詞形變化
  fullPhrase: [],    // correctAnswer 是整個多字片語
  other: [],         // 其他
};

for (const item of phraseItems) {
  const vocab = vocabMap.get(item.id);
  if (!vocab) continue;

  const correct = item.correctAnswer.trim().toLowerCase();
  const vocabWord = vocab.english_word.trim().toLowerCase();

  if (correct === vocabWord) {
    phrasePatterns.exact.push(item);
  } else if (vocabWord.includes(correct)) {
    phrasePatterns.partOfPhrase.push(item);
  } else if (isPhrase(correct) && !isPhrase(vocabWord)) {
    phrasePatterns.other.push(item);
  } else if (isPhrase(correct)) {
    phrasePatterns.fullPhrase.push(item);
  } else {
    // 單字，可能是詞形變化
    const forms = getWordForms(vocabWord);
    const vocabWords = vocabWord.split(/\s+/);
    const anyFormMatch = vocabWords.some(vw => getWordForms(vw).includes(correct));
    if (forms.includes(correct) || anyFormMatch) {
      phrasePatterns.wordForm.push(item);
    } else {
      phrasePatterns.other.push(item);
    }
  }
}

console.log('\n   3a. correctAnswer 與 english_word 的關係:');
console.log(`     完全一致（整個片語是答案）: ${phrasePatterns.exact.length}`);
console.log(`     片語的一部分（填入關鍵字）: ${phrasePatterns.partOfPhrase.length}`);
console.log(`     詞形變化:                    ${phrasePatterns.wordForm.length}`);
console.log(`     多字 correctAnswer:          ${phrasePatterns.fullPhrase.length}`);
console.log(`     其他（需要檢查）:            ${phrasePatterns.other.length}`);

if (phrasePatterns.other.length > 0) {
  const showCount = verbose ? phrasePatterns.other.length : Math.min(15, phrasePatterns.other.length);
  console.log(`\n     「其他」清單 (${verbose ? '全部' : '前 15'}):` );
  phrasePatterns.other.slice(0, showCount).forEach(item => {
    const vocab = vocabMap.get(item.id);
    console.log(`     [${item.id}] vocab="${vocab?.english_word}" → correctAnswer="${item.correctAnswer}"`);
  });
  if (!verbose && phrasePatterns.other.length > 15) {
    console.log(`     ... 還有 ${phrasePatterns.other.length - 15} 題`);
  }
}

// 3b. 片語題 makeCloze 驗證（從檢查 1 的失敗中篩選片語題）
const phraseClozeFailures = clozeFailures.filter(f => f.type === '片語題' || f.type === '搭配詞題');
const phraseWithSentences = phraseItems.filter(item => {
  const vocab = vocabMap.get(item.id);
  return vocab && vocab.example_sentence && vocab.example_sentence.trim();
});

console.log(`\n   3b. 片語/搭配詞 填空渲染:`);
console.log(`     有例句的片語/搭配詞題: ${phraseWithSentences.length}`);
console.log(`     ❌ 無法正常挖空: ${phraseClozeFailures.length}`);
console.log(`     通過率: ${((phraseWithSentences.length - phraseClozeFailures.length) / phraseWithSentences.length * 100).toFixed(1)}%`);

if (phraseClozeFailures.length > 0) {
  const showCount = verbose ? phraseClozeFailures.length : Math.min(10, phraseClozeFailures.length);
  console.log(`\n     片語填空失敗清單 (${verbose ? '全部' : '前 10'}):` );
  phraseClozeFailures.slice(0, showCount).forEach(f => {
    console.log(`     [${f.id}] ${f.word} → correctAnswer="${f.correctAnswer}"`);
    console.log(`       例句: "${f.sentence}..."`);
  });
  if (!verbose && phraseClozeFailures.length > 10) {
    console.log(`     ... 還有 ${phraseClozeFailures.length - 10} 題`);
  }
}

// 3c. 片語干擾選項品質（基本檢查）
let phraseDistractorIssues = 0;
const phraseDistractorProblems = [];

for (const item of phraseItems) {
  if (!Array.isArray(item.distractors)) continue;
  for (const d of item.distractors) {
    if (!d.word || !d.word.trim()) continue;
    // 檢查: 干擾選項是否跟正確答案完全一樣（大小寫不敏感）
    if (d.word.trim().toLowerCase() === item.correctAnswer.trim().toLowerCase()) {
      phraseDistractorIssues++;
      if (phraseDistractorProblems.length < 10) {
        phraseDistractorProblems.push({
          id: item.id,
          word: item.english_word,
          correct: item.correctAnswer,
          distractor: d.word,
        });
      }
    }
  }
}

console.log(`\n   3c. 片語干擾選項基本檢查:`);
console.log(`     干擾選項 = 正確答案: ${phraseDistractorIssues}`);
if (phraseDistractorProblems.length > 0) {
  phraseDistractorProblems.forEach(p => {
    console.log(`     [${p.id}] ${p.word}: distractor="${p.distractor}" = correct="${p.correct}"`);
  });
}

// ============================================================
// 檢查 4：ID 覆蓋率
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('🔍 檢查 4：ID 覆蓋率');
console.log('='.repeat(70));

const quizIds = new Set(quizData.map(q => q.id));
const missingIds = vocabData.filter(v => !quizIds.has(v.id));

let missingWithSentence = 0;
let missingWithoutSentence = 0;
const missingWithSentenceList = [];

for (const v of missingIds) {
  if (v.example_sentence && v.example_sentence.trim()) {
    missingWithSentence++;
    if (missingWithSentenceList.length < 20) {
      missingWithSentenceList.push(v);
    }
  } else {
    missingWithoutSentence++;
  }
}

// 檢查是否有 quiz 中的 ID 不存在於 vocabulary
const orphanQuiz = quizData.filter(q => !vocabMap.has(q.id));

console.log(`\n   vocabulary 總數: ${vocabData.length}`);
console.log(`   quiz-options 總數: ${quizData.length}`);
console.log(`   差距: ${vocabData.length - quizData.length}`);
console.log(`\n   缺少 quiz option 的 vocabulary:`);
console.log(`     有例句: ${missingWithSentence} ← ⚠️ 應該要有 quiz option`);
console.log(`     無例句: ${missingWithoutSentence} ← 合理（無法出填空題）`);

if (missingWithSentenceList.length > 0) {
  console.log(`\n   有例句但無 quiz option 的清單:`);
  missingWithSentenceList.forEach(v => {
    console.log(`     [${v.id}] ${v.english_word} | ${(v.example_sentence || '').slice(0, 60)}...`);
  });
  if (missingWithSentence > 20) {
    console.log(`     ... 還有 ${missingWithSentence - 20} 筆`);
  }
}

if (orphanQuiz.length > 0) {
  console.log(`\n   ⚠️ quiz 中有 ${orphanQuiz.length} 題找不到對應的 vocabulary:`);
  orphanQuiz.slice(0, 10).forEach(q => {
    console.log(`     [${q.id}] ${q.english_word}`);
  });
}

// ============================================================
// 總結
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('📊 深層品質驗證總結');
console.log('='.repeat(70));

const issues = [];

console.log(`\n   檢查 1 — 填空渲染:   ${clozePass}/${clozeTotal} 通過 (${clozePct}%)`);
if (clozeFailures.length > 0) {
  issues.push(`${clozeFailures.length} 題填空會 fallback`);
  console.log(`              ${clozeFailures.length} 題會顯示為句尾 (_____)  ⚠️`);
}

console.log(`   檢查 2 — 答案對齊:   ${alignMismatch.length} 題真正不一致`);
if (alignMismatch.length > 0) {
  issues.push(`${alignMismatch.length} 題 correctAnswer 與 vocabulary 不一致`);
  console.log(`              ${alignExact.length} 完全一致 + ${alignWordForm.length} 詞形變化 + ${alignPartial.length} 部分匹配  ✅`);
}

console.log(`   檢查 3 — 片語專項:   ${phraseClozeFailures.length} 題片語填空失敗, ${phrasePatterns.other.length} 題關係不明`);
if (phraseClozeFailures.length > 0 || phrasePatterns.other.length > 0) {
  issues.push(`${phraseClozeFailures.length} 題片語填空失敗`);
}

console.log(`   檢查 4 — ID 覆蓋:    缺 ${missingIds.length} 題 (有例句 ${missingWithSentence}, 無例句 ${missingWithoutSentence})`);
if (missingWithSentence > 0) {
  issues.push(`${missingWithSentence} 筆有例句但無 quiz option`);
}

console.log('\n   ' + (issues.length === 0
  ? '✅ 所有深層檢查通過！'
  : `⚠️ 發現 ${issues.length} 類問題需要關注:`));

if (issues.length > 0) {
  issues.forEach((issue, i) => console.log(`     ${i + 1}. ${issue}`));
}

console.log('\n' + '='.repeat(70) + '\n');
