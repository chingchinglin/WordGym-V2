import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const report = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts/fake-words-report.txt'), 'utf-8');
const lines = report.split('\n').filter(l => l.startsWith('['));

// 這些模式的字雖然不在字典裡，但幾乎確定是真字
function isLikelyReal(word) {
  const w = word.toLowerCase().trim();

  // 所有格、縮寫
  if (w.includes("'")) return true;

  // 常見真實字（字典漏收的）
  const knownReal = new Set([
    'families', 'women', 'children', 'cookies', 'earliest', 'largest', 'biggest',
    'smallest', 'downloaded', 'upload', 'hardest', 'fastest', 'tallest', 'longest',
    'youngest', 'oldest', 'happiest', 'busiest', 'laziest', 'prettiest', 'ugliest',
    'funniest', 'easiest', 'heaviest', 'healthiest', 'wealthiest', 'luckiest',
    'noisiest', 'dirtiest', 'tidiest', 'angriest', 'friendliest',
    'download', 'uploads', 'online', 'offline', 'email', 'emails',
    'smartphone', 'smartphones', 'website', 'websites', 'internet',
    'selfie', 'selfies', 'blog', 'blogs', 'vlog', 'vlogs',
    'ok', 'okay', 'yeah', 'nope', 'gonna', 'wanna', 'gotta',
    'grandpa', 'grandma', 'goodbye', 'goodnight',
    'classmate', 'classmates', 'teammate', 'teammates',
    'boyfriend', 'girlfriend', 'birthplace', 'workplace',
    'textbook', 'textbooks', 'bookstore', 'bookstores',
    'nonstop', 'nonprofit', 'worldwide', 'everyday', 'everyone',
    'boxed', 'boxes', 'foxes', 'quizzes', 'buzzes',
    'pr', 'iq', 'pe', 'dj',
  ]);
  if (knownReal.has(w)) return true;

  // 常見動詞變形 -ies, -ied
  if (/ies$|ied$/.test(w)) return true;

  // 比較級最高級 -ier, -iest, -er, -est (已在字幹後)
  if (/iest$|ier$/.test(w)) return true;

  // -ful, -less, -ness, -ment, -tion, -sion 結尾的常見詞
  // 已經在 check-fake-words 裡處理過了，這裡跳過

  return false;
}

const trueSuspects = [];
const falseAlarms = [];

for (const line of lines) {
  const match = line.match(/→ "(.+?)"/);
  if (!match) continue;
  const word = match[1];

  if (isLikelyReal(word)) {
    falseAlarms.push(line);
  } else {
    trueSuspects.push({ line, word });
  }
}

console.log(`總可疑: ${lines.length}`);
console.log(`誤報（其實是真字）: ${falseAlarms.length}`);
console.log(`仍可疑: ${trueSuspects.length}`);
console.log('');

// 按字分群
const wordGroups = new Map();
for (const s of trueSuspects) {
  const w = s.word.toLowerCase();
  if (!wordGroups.has(w)) wordGroups.set(w, []);
  wordGroups.get(w).push(s.line);
}

console.log(`不重複可疑字: ${wordGroups.size}`);
console.log('');

// 顯示出現最多次的可疑字
const sorted = [...wordGroups.entries()].sort((a, b) => b[1].length - a[1].length);
console.log('--- 出現最多次的可疑字 (前 50) ---');
sorted.slice(0, 50).forEach(([word, entries]) => {
  console.log(`"${word}" (${entries.length} 次) — 例: ${entries[0].substring(0, 80)}`);
});

// 輸出完整可疑字清單
const outPath = path.join(PROJECT_ROOT, 'scripts/true-suspects.txt');
const outLines = [`# 過濾後仍可疑的干擾選項（${trueSuspects.length} 個，${wordGroups.size} 個不重複字）\n`];
sorted.forEach(([word, entries]) => {
  outLines.push(`\n"${word}" (${entries.length} 次)`);
  entries.forEach(e => outLines.push(`  ${e}`));
});
fs.writeFileSync(outPath, outLines.join('\n'));
console.log(`\n📄 完整清單: scripts/true-suspects.txt`);
