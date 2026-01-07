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
