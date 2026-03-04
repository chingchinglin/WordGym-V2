import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const report = fs.readFileSync(path.join(__dirname, 'fake-words-report.txt'), 'utf-8');
const lines = report.split('\n').filter(l => l.startsWith('['));

// 提取所有可疑字並計數
const wordCount = new Map();
const wordLines = new Map();
for (const line of lines) {
  const m = line.match(/干擾: "(.+?)"/);
  if (m) {
    const w = m[1];
    wordCount.set(w, (wordCount.get(w) || 0) + 1);
    if (!wordLines.has(w)) wordLines.set(w, line);
  }
}

const sorted = [...wordCount.entries()].sort((a, b) => b[1] - a[1]);
console.log(`不重複可疑字: ${sorted.length}\n`);

// 分類
const possessives = [];
const contractions = [];
const phrases = [];
const others = [];

for (const [word, count] of sorted) {
  if (word.includes("'")) {
    if (word.includes("n't") || word.includes("'re") || word.includes("'ve") || word.includes("'ll") || word.includes("'d") || word.includes("'m")) {
      contractions.push([word, count]);
    } else {
      possessives.push([word, count]);
    }
  } else if (word.includes(' ') || word.includes('.')) {
    phrases.push([word, count]);
  } else {
    others.push([word, count]);
  }
}

console.log(`=== 所有格 (${possessives.length} 個) === 都是真實的英文表達`);
console.log(possessives.slice(0, 15).map(([w]) => w).join(', '));
if (possessives.length > 15) console.log(`... 等共 ${possessives.length} 個`);

console.log(`\n=== 縮寫 (${contractions.length} 個) === 都是真實的英文`);
console.log(contractions.map(([w]) => w).join(', '));

console.log(`\n=== 詞組/句子 (${phrases.length} 個) === 需人工確認`);
phrases.forEach(([w, c]) => console.log(`  "${w}" (${c}次)`));

console.log(`\n=== 單字 (${others.length} 個) === 需逐一確認`);
others.forEach(([w, c]) => console.log(`  "${w}" (${c}次)`));
