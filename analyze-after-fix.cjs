const fs = require('fs');

// Load vocabulary data
const vocabulary = JSON.parse(fs.readFileSync('./src/data/vocabulary.json', 'utf8'));

// Improved makeCloze function
const escapeForRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getBaseWord = (word) => {
  return word.split('(')[0].trim();
};

const IRREGULAR_VERBS = {
  become: ["became", "becoming"],
  begin: ["began", "begun", "beginning"],
  find: ["found", "finding"],
  hide: ["hid", "hidden", "hiding"],
  light: ["lit", "lighted", "lighting"],
  write: ["wrote", "written", "writing"],
  speak: ["spoke", "spoken", "speaking"],
  break: ["broke", "broken", "breaking"],
  choose: ["chose", "chosen", "choosing"],
  drive: ["drove", "driven", "driving"],
  eat: ["ate", "eaten", "eating"],
  fall: ["fell", "fallen", "falling"],
  give: ["gave", "given", "giving"],
  know: ["knew", "known", "knowing"],
  ride: ["rode", "ridden", "riding"],
  see: ["saw", "seen", "seeing"],
  take: ["took", "taken", "taking"],
  go: ["went", "gone", "going"],
  do: ["did", "done", "doing"],
  have: ["had", "having"],
  make: ["made", "making"],
  come: ["came", "coming"],
  run: ["ran", "running"],
  sit: ["sat", "sitting"],
  stand: ["stood", "standing"],
  understand: ["understood", "understanding"],
  teach: ["taught", "teaching"],
  catch: ["caught", "catching"],
  bring: ["brought", "bringing"],
  buy: ["bought", "buying"],
  think: ["thought", "thinking"],
  fight: ["fought", "fighting"],
  seek: ["sought", "seeking"],
  feel: ["felt", "feeling"],
  keep: ["kept", "keeping"],
  leave: ["left", "leaving"],
  lose: ["lost", "losing"],
  meet: ["met", "meeting"],
  pay: ["paid", "paying"],
  say: ["said", "saying"],
  sell: ["sold", "selling"],
  send: ["sent", "sending"],
  spend: ["spent", "spending"],
  tell: ["told", "telling"],
  win: ["won", "winning"],
  build: ["built", "building"],
  hear: ["heard", "hearing"],
  hold: ["held", "holding"],
  read: ["read", "reading"],
  sleep: ["slept", "sleeping"],
  wear: ["wore", "worn", "wearing"],
  bear: ["bore", "born", "bearing"],
  tear: ["tore", "torn", "tearing"],
  swim: ["swam", "swum", "swimming"],
  sing: ["sang", "sung", "singing"],
  drink: ["drank", "drunk", "drinking"],
  ring: ["rang", "rung", "ringing"],
  sink: ["sank", "sunk", "sinking"],
  spring: ["sprang", "sprung", "springing"],
  grow: ["grew", "grown", "growing"],
  throw: ["threw", "thrown", "throwing"],
  blow: ["blew", "blown", "blowing"],
  fly: ["flew", "flown", "flying"],
  draw: ["drew", "drawn", "drawing"],
  withdraw: ["withdrew", "withdrawn", "withdrawing"],
};

const getWordForms = (word) => {
  const base = getBaseWord(word).toLowerCase();
  const forms = [base];

  forms.push(base + "s");
  forms.push(base + "es");
  forms.push(base + "ed");
  forms.push(base + "ing");
  forms.push(base + "d");

  if (base.endsWith("e")) {
    forms.push(base.slice(0, -1) + "ing");
    forms.push(base + "d");
  }

  if (/[aeiou][bcdfghlmnprstvwz]$/.test(base)) {
    const doubled = base + base.slice(-1);
    forms.push(doubled + "ed");
    forms.push(doubled + "ing");
  }

  if (base.endsWith("y") && !/[aeiou]y$/.test(base)) {
    forms.push(base.slice(0, -1) + "ies");
    forms.push(base.slice(0, -1) + "ied");
  }

  forms.push(base + "s");
  forms.push(base + "es");
  if (base.endsWith("y") && !/[aeiou]y$/.test(base)) {
    forms.push(base.slice(0, -1) + "ies");
  }

  forms.push(base + "er");
  forms.push(base + "est");
  forms.push(base + "ly");

  // Word class transformations
  if (base.endsWith("al")) {
    forms.push(base.slice(0, -2) + "e");
    forms.push(base.slice(0, -2));
  }
  if (base.endsWith("ment")) {
    forms.push(base.slice(0, -4));
  }
  if (base.endsWith("tion")) {
    forms.push(base.slice(0, -3) + "e");
    forms.push(base.slice(0, -4));
  }
  if (base.endsWith("sion")) {
    forms.push(base.slice(0, -3) + "e");
    forms.push(base.slice(0, -4));
  }
  if (base.endsWith("ness")) {
    forms.push(base.slice(0, -4));
    forms.push(base.slice(0, -4) + "y");
  }
  if (base.endsWith("ence")) {
    forms.push(base.slice(0, -3) + "t");
  }
  if (base.endsWith("ance")) {
    forms.push(base.slice(0, -3) + "t");
  }
  if (base.endsWith("ly")) {
    forms.push(base.slice(0, -2));
    if (base.endsWith("ily")) {
      forms.push(base.slice(0, -3) + "y");
    }
  }
  if (base.endsWith("ing")) {
    forms.push(base.slice(0, -3));
    forms.push(base.slice(0, -3) + "e");
    forms.push(base.slice(0, -3) + "ed");
  }

  // Irregular verbs
  if (IRREGULAR_VERBS[base]) {
    forms.push(...IRREGULAR_VERBS[base]);
  }

  for (const [root, irregulars] of Object.entries(IRREGULAR_VERBS)) {
    if (irregulars.includes(base)) {
      forms.push(root);
      forms.push(...irregulars);
    }
  }

  return [...new Set(forms)];
};

const makeCloze = (sentence, answer) => {
  const baseWord = getBaseWord(answer);
  const esc = escapeForRegex(baseWord);
  const exactRx = new RegExp(`(^|[^A-Za-z])(${esc})(?=[^A-Za-z]|$)`, 'i');
  if (exactRx.test(sentence)) {
    return String(sentence).replace(exactRx, (m) =>
      m.replace(new RegExp(esc, 'i'), '_____')
    );
  }
  const wordForms = getWordForms(baseWord);
  for (const form of wordForms) {
    const formEsc = escapeForRegex(form);
    const formRx = new RegExp(`(^|[^A-Za-z])(${formEsc})(?=[^A-Za-z]|$)`, 'i');
    if (formRx.test(sentence)) {
      return String(sentence).replace(formRx, (m) =>
        m.replace(new RegExp(formEsc, 'i'), '_____')
      );
    }
  }
  if (baseWord.length >= 3) {
    const prefixRx = new RegExp(
      `(^|[^A-Za-z])(${esc}[a-z]*)(?=[^A-Za-z]|$)`,
      'i'
    );
    if (prefixRx.test(sentence)) {
      return String(sentence).replace(prefixRx, (m, prefix, word) =>
        m.replace(word, '_____')
      );
    }
  }
  return sentence;
};

// Analyze all words
const wordsWithSentences = vocabulary.filter(w => w.example_sentence && w.example_sentence.trim());
const failedWords = [];

wordsWithSentences.forEach(word => {
  const result = makeCloze(word.example_sentence, word.english_word);
  if (!result.includes('_____')) {
    failedWords.push({
      english_word: word.english_word,
      example_sentence: word.example_sentence
    });
  }
});

console.log(`Total words with example sentences: ${wordsWithSentences.length}`);
console.log(`Words that fail to generate cloze: ${failedWords.length}`);
console.log(`Success rate: ${((wordsWithSentences.length - failedWords.length) / wordsWithSentences.length * 100).toFixed(2)}%`);
console.log(`Failure rate: ${(failedWords.length / wordsWithSentences.length * 100).toFixed(2)}%`);
console.log(`Improvement: ${289 - failedWords.length} words fixed (${((1 - failedWords.length/289) * 100).toFixed(1)}% reduction in failures)`);

console.log('\n=== First 20 remaining failed words ===');
failedWords.slice(0, 20).forEach(w => {
  console.log(`\nWord: ${w.english_word}`);
  console.log(`Sentence: ${w.example_sentence}`);
});
