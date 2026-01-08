import { VocabularyWord } from "../types";

// Utility function to escape special regex characters
const escapeForRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Get base word (remove brackets and clean up)
const getBaseWord = (word: string): string => {
  // Remove anything in parentheses: "he (him; his)" -> "he"
  return word.split("(")[0].trim();
};

// Common irregular verb forms mapping
const IRREGULAR_VERBS: Record<string, string[]> = {
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

// Generate common word forms for matching
const getWordForms = (word: string): string[] => {
  const base = getBaseWord(word).toLowerCase();
  const forms = [base];

  // Common verb conjugations
  forms.push(base + "s"); // walk -> walks
  forms.push(base + "es"); // go -> goes
  forms.push(base + "ed"); // walk -> walked
  forms.push(base + "ing"); // walk -> walking
  forms.push(base + "d"); // love -> loved

  // Handle -e ending verbs
  if (base.endsWith("e")) {
    forms.push(base.slice(0, -1) + "ing"); // love -> loving
    forms.push(base + "d"); // love -> loved
  }

  // Handle consonant doubling
  if (/[aeiou][bcdfghlmnprstvwz]$/.test(base)) {
    const doubled = base + base.slice(-1);
    forms.push(doubled + "ed"); // stop -> stopped
    forms.push(doubled + "ing"); // stop -> stopping
  }

  // Handle -y ending
  if (base.endsWith("y") && !/[aeiou]y$/.test(base)) {
    forms.push(base.slice(0, -1) + "ies"); // study -> studies
    forms.push(base.slice(0, -1) + "ied"); // study -> studied
  }

  // Noun plurals
  forms.push(base + "s");
  forms.push(base + "es");
  if (base.endsWith("y") && !/[aeiou]y$/.test(base)) {
    forms.push(base.slice(0, -1) + "ies"); // city -> cities
  }

  // Adjective forms
  forms.push(base + "er"); // fast -> faster
  forms.push(base + "est"); // fast -> fastest
  forms.push(base + "ly"); // quick -> quickly

  // Word class transformations (noun <-> verb <-> adjective)
  // arrival -> arrive, defense -> defend
  if (base.endsWith("al")) {
    forms.push(base.slice(0, -2) + "e"); // arrival -> arrive
    forms.push(base.slice(0, -2)); // arrival -> arriv (will match arrive via prefix)
  }
  if (base.endsWith("ment")) {
    forms.push(base.slice(0, -4)); // development -> develop
  }
  if (base.endsWith("tion")) {
    forms.push(base.slice(0, -3) + "e"); // completion -> complete
    forms.push(base.slice(0, -4)); // completion -> complet (will match)
  }
  if (base.endsWith("sion")) {
    forms.push(base.slice(0, -3) + "e"); // decision -> decide
    forms.push(base.slice(0, -4)); // decision -> decis
  }
  if (base.endsWith("ness")) {
    forms.push(base.slice(0, -4)); // readiness -> readi (will match ready)
    forms.push(base.slice(0, -4) + "y"); // readiness -> ready
  }
  if (base.endsWith("ence")) {
    forms.push(base.slice(0, -3) + "t"); // difference -> different
  }
  if (base.endsWith("ance")) {
    forms.push(base.slice(0, -3) + "t"); // importance -> important
  }
  if (base.endsWith("ly")) {
    forms.push(base.slice(0, -2)); // readily -> readi (will match ready)
    if (base.endsWith("ily")) {
      forms.push(base.slice(0, -3) + "y"); // readily -> ready
    }
  }
  if (base.endsWith("ing")) {
    forms.push(base.slice(0, -3)); // defending -> defend
    forms.push(base.slice(0, -3) + "e"); // defending -> defende
    forms.push(base.slice(0, -3) + "ed"); // defending -> defended
  }

  // Common irregular verb forms
  if (IRREGULAR_VERBS[base]) {
    forms.push(...IRREGULAR_VERBS[base]);
  }

  // Also check if base is an irregular form of something
  for (const [root, irregulars] of Object.entries(IRREGULAR_VERBS)) {
    if (irregulars.includes(base)) {
      forms.push(root);
      forms.push(...irregulars);
    }
  }

  return [...new Set(forms)];
};

// Make cloze sentence by replacing the answer with blanks
export const makeCloze = (sentence: string, answer: string): string => {
  const baseWord = getBaseWord(answer);
  const esc = escapeForRegex(baseWord);

  // First try exact match
  const exactRx = new RegExp(`(^|[^A-Za-z])(${esc})(?=[^A-Za-z]|$)`, "i");
  if (exactRx.test(sentence)) {
    return String(sentence).replace(exactRx, (m) =>
      m.replace(new RegExp(esc, "i"), "_____"),
    );
  }

  // Try matching word forms
  const wordForms = getWordForms(baseWord);
  for (const form of wordForms) {
    const formEsc = escapeForRegex(form);
    const formRx = new RegExp(`(^|[^A-Za-z])(${formEsc})(?=[^A-Za-z]|$)`, "i");
    if (formRx.test(sentence)) {
      return String(sentence).replace(formRx, (m) =>
        m.replace(new RegExp(formEsc, "i"), "_____"),
      );
    }
  }

  // Fallback: find any word that starts with the base word (3+ chars)
  if (baseWord.length >= 3) {
    const prefixRx = new RegExp(
      `(^|[^A-Za-z])(${esc}[a-z]*)(?=[^A-Za-z]|$)`,
      "i",
    );
    if (prefixRx.test(sentence)) {
      return String(sentence).replace(prefixRx, (m, prefix, word) =>
        m.replace(word, "_____"),
      );
    }
  }

  // Last resort: return original sentence (no blank)
  return sentence;
};

export const generateDisractors = (
  correctWord: VocabularyWord,
  allWords: VocabularyWord[],
  numOptions: number = 3,
): string[] => {
  // Filter words with the same part of speech
  const samePosWords = allWords
    .filter(
      (word) => word.pos === correctWord.pos && word.id !== correctWord.id,
    )
    .sort(() => 0.5 - Math.random());

  // If not enough words with same POS, use any words
  const fallbackWords = allWords
    .filter((word) => word.id !== correctWord.id)
    .sort(() => 0.5 - Math.random());

  const candidates =
    samePosWords.length >= numOptions
      ? samePosWords
      : [...samePosWords, ...fallbackWords];

  // Generate distractors, preferring similar words
  const distractors = candidates
    .slice(0, numOptions)
    .map((word) => word.chinese_definition);

  // Shuffle options and ensure no duplicates
  return [...new Set(distractors)];
};

export const generateSentenceCloze = (word: VocabularyWord): string => {
  // Prefer example sentences from the first language example
  const examples = word.languageExamples || [];

  if (examples.length === 0) {
    return `在哪裡放置 ${word.english} ?`;
  }

  const example = examples[0];
  const clozeExample = example.replace(new RegExp(word.english, "gi"), "_____");

  return clozeExample;
};
