/**
 * CSVDataService - Fetches vocabulary data from Google Apps Script
 *
 * 安全更新：使用 Google Apps Script 作為代理
 * - Google Sheet URL 隱藏在 GAS 中
 * - 用戶只能看到 GAS URL，無法得知 Sheet ID
 */

import { VocabularyWord } from "../types";
import { IndexedDBCache } from "./IndexedDBCache";
import { normalizePOS } from "../utils/dataProcessing";

// Google Apps Script Web App URL (隱藏了 Google Sheet URL)
const GAS_URL =
  "https://script.google.com/macros/s/AKfycby7JqFMq9YsFVl8AJFw5OnTwyjnvUL-h5HdN-IYzNlUYqqiJdHFRRsrGUJHtAcUwC4/exec";

// Cache expiry: 24 hours (in milliseconds)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface CSVDataResult {
  data: VocabularyWord[];
  fromCache: boolean;
  cacheAge?: number; // milliseconds since cache was created
}

/**
 * Parse textbook_index string to array of objects
 * Format: "龍騰-B1-U4" or "龍騰-B1-U4; 翰林-B2-L3" (semicolon separated)
 */
function parseTextbookIndex(
  textbookIndexStr: string,
): { version: string; vol: string; lesson: string }[] {
  if (!textbookIndexStr || textbookIndexStr.trim() === "") {
    return [];
  }

  const entries = textbookIndexStr.split(";").map((s) => s.trim());
  const result: { version: string; vol: string; lesson: string }[] = [];

  for (const entry of entries) {
    if (!entry) continue;

    // Handle different formats:
    // "龍騰-B1-U4" -> version=龍騰, vol=B1, lesson=U4
    // "康軒-B1-U1" -> version=康軒, vol=B1, lesson=U1
    const parts = entry.split("-");
    if (parts.length >= 3) {
      result.push({
        version: parts[0],
        vol: parts[1],
        lesson: parts.slice(2).join("-"), // Handle cases like "U4-1"
      });
    } else if (parts.length === 2) {
      // "B1-U4" format (no version)
      result.push({
        version: "",
        vol: parts[0],
        lesson: parts[1],
      });
    }
  }

  return result;
}

/**
 * Helper to ensure value is a string
 * Handles boolean values from Google Sheets (true/false interpreted as booleans)
 */
function ensureString(value: any): string {
  if (value === null || value === undefined) return "";
  // Handle booleans specially - Google Sheets interprets "true"/"false" cells as booleans
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

/**
 * Parse synonyms/antonyms field into structured format
 * Handles formats like:
 * - "n.禮物；贈品 gift" -> { pos: "n.", meaning: "禮物；贈品", words: ["gift"] }
 * - "power; skill; talent" -> { pos: "", meaning: "", words: ["power", "skill", "talent"] }
 */
function parseSynonymsAntonyms(
  value: string
): Array<{ pos: string; meaning: string; words: string[] }> {
  if (!value || value.trim() === "") return [];

  const lines = value.trim().split("\n");
  const groups: Array<{ pos: string; meaning: string; words: string[] }> = [];

  // Check if single line with no POS/Chinese - old format
  if (lines.length === 1) {
    const line = lines[0].trim();
    const hasPOS = /^[a-z]+\./i.test(line);
    const hasChinese = /[\u4e00-\u9fff]/.test(line);

    if (!hasPOS && !hasChinese) {
      // Old format: English words only, split by ; or ,
      const words = line
        .split(/[;,]/)
        .map((w) => w.trim())
        .filter(Boolean);
      if (words.length > 0) {
        return [{ pos: "", meaning: "", words }];
      }
      return [];
    }
  }

  // New format: parse with POS and Chinese meanings
  let currentPos = "";
  let currentMeaning = "";
  let currentWords: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for POS pattern: n.xxx, vi.xxx, adj.xxx, vt.xxx, etc.
    const posMatch = line.match(/^([a-z]+\.)\s*(.+)$/i);
    if (posMatch) {
      // Save previous group
      if (currentMeaning || currentWords.length > 0) {
        groups.push({
          pos: currentPos,
          meaning: currentMeaning,
          words: currentWords,
        });
      }

      // Start new group
      currentPos = posMatch[1];
      const titleContent = posMatch[2].trim();

      // Split content: Chinese part is meaning, English words are words
      const chineseParts: string[] = [];
      const englishWords: string[] = [];

      // Split by space and categorize
      const parts = titleContent.split(/\s+/);
      let foundChinese = false;

      for (const part of parts) {
        const partHasChinese = /[\u4e00-\u9fff]/.test(part);
        const isEnglishWord =
          /^[a-zA-Z]/.test(part) && !partHasChinese;

        if (partHasChinese) {
          foundChinese = true;
          chineseParts.push(part);
        } else if (foundChinese && isEnglishWord) {
          // English word after Chinese - it's a word
          // Handle semicolon-separated words
          if (part.includes(";")) {
            englishWords.push(...part.split(";").map((w) => w.trim()).filter(Boolean));
          } else {
            englishWords.push(part);
          }
        } else if (!foundChinese && partHasChinese === false) {
          // Before any Chinese - still part of meaning or word
          chineseParts.push(part);
        }
      }

      currentMeaning = chineseParts.join(" ");
      currentWords = englishWords;
    } else {
      // English words line - split by semicolon
      const words = line
        .split(";")
        .map((w) => w.trim())
        .filter(Boolean);
      currentWords.push(...words);
    }
  }

  // Save last group
  if (currentMeaning || currentWords.length > 0) {
    groups.push({
      pos: currentPos,
      meaning: currentMeaning,
      words: currentWords,
    });
  }

  return groups;
}

/**
 * Convert GAS JSON response to VocabularyWord format
 */
function convertToVocabularyWord(row: any, index: number): VocabularyWord {
  // Parse textbook_index
  const textbookIndexStr = ensureString(row.textbook_index || row["textbook_index"]);
  const textbookIndex = parseTextbookIndex(textbookIndexStr);

  // Get first textbook entry for backwards compatibility
  const firstTextbook = textbookIndex[0] || { version: "", vol: "", lesson: "" };

  // Parse POS - handle multiple POS like "(adj./n./v.)"
  // GAS returns "(n.)" or "(adj./n./v.)" format
  const posOriginal = ensureString(row["詞性"] || row.pos); // Keep original format for display
  const posRaw = posOriginal.replace(/[()]/g, "");
  // Split by "/" to handle multiple POS and normalize each
  const posParts = posRaw.split("/").map(p => p.trim()).filter(Boolean);
  const normalizedPosList = posParts
    .map(p => normalizePOS(p))
    .filter(tag => tag && tag !== "other");
  // If no valid POS found, add "other"
  const posTags: string[] = normalizedPosList.length > 0
    ? normalizedPosList
    : (posRaw ? ["other"] : []);
  // Get first POS for the pos field (typed as POSType)
  const firstPos = normalizedPosList[0];
  const normalizedPos = firstPos || (posRaw ? normalizePOS(posRaw) : undefined);

  // Build examples array
  const examples: { sentence: string; translation: string }[] = [];

  // Example 1
  const example1Sentence = ensureString(row["例句"] || row.example_sentence);
  const example1Translation = ensureString(row["翻譯"] || row.example_translation);
  if (example1Sentence) {
    examples.push({
      sentence: example1Sentence,
      translation: example1Translation,
    });
  }

  // Examples 2-5
  for (let i = 2; i <= 5; i++) {
    const sentence = ensureString(row[`例句${i}`]);
    const translation = ensureString(row[`翻譯${i}`]);
    if (sentence) {
      examples.push({ sentence, translation });
    }
  }

  // Parse themes (for senior: generic themes)
  // Parse theme_index (for junior: structured format like "1200-介系詞-1")
  const themeStr = ensureString(row["主題"] || row.theme);
  const stageRaw = ensureString(row.stage || row["stage"] || row["Stage"]);
  const isJuniorStage = stageRaw === "國中" || stageRaw === "junior" || stageRaw.toLowerCase().includes("junior") || stageRaw.includes("國中");

  // For junior: Parse theme_index from "主題" field (format: "1200-介系詞-1")
  const themeIndex: { range: string; theme: string }[] = [];
  let themes: string[] = [];

  if (isJuniorStage && themeStr) {
    // Parse as theme_index for junior (format: "1200-介系詞-1" or "1200-介系詞-1; 800-介系詞-2")
    const items = themeStr.split(/[;|]/).map((s: string) => s.trim()).filter(Boolean);
    items.forEach((item: string) => {
      const parts = item.split("-").map((s: string) => s.trim());
      if (parts.length >= 2) {
        const range = parts[0];
        const theme = parts.slice(1).join("-");
        // Check range is a number (1200 or 800)
        if (/^\d+$/.test(range) && theme) {
          themeIndex.push({ range, theme });
          // Also add theme to themes array for compatibility
          if (!themes.includes(theme)) {
            themes.push(theme);
          }
        }
      }
    });
  } else if (themeStr) {
    // For senior: Just split by semicolon as generic themes
    themes = themeStr.split(";").map((t: string) => t.trim()).filter(Boolean);
  }

  // Parse synonyms/antonyms as structured format
  // Supports: "n.禮物；贈品 gift" -> { pos: "n.", meaning: "禮物；贈品", words: ["gift"] }
  const synonymsRaw = ensureString(row["同義字"] || row.synonyms);
  const synonyms = parseSynonymsAntonyms(synonymsRaw);

  const antonymsRaw = ensureString(row["反義字"] || row.antonyms);
  const antonyms = parseSynonymsAntonyms(antonymsRaw);

  const confusablesRaw = ensureString(row["易混淆字"] || row.confusables);
  const confusables = confusablesRaw ? confusablesRaw.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean) : [];

  // Build affix_info
  const affixInfo = {
    prefix: ensureString(row["字首"]),
    root: ensureString(row["字根"]),
    suffix: ensureString(row["字尾"]),
    meaning: ensureString(row["意思"]),
    example: ensureString(row["例子"]),
  };

  // Get english word - critical field
  const englishWord = ensureString(row.english_word || row["english_word"]);

  // Get phrases
  const phrasesRaw = ensureString(row["搭配詞"]);
  const phrases = phrasesRaw ? phrasesRaw.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean) : [];

  return {
    id: index + 1,
    english_word: englishWord,
    english: englishWord,
    chinese_definition: ensureString(row["中譯"] || row.chinese_definition),
    example_sentence: example1Sentence,
    example_translation: example1Translation,
    example_sentence_2: ensureString(row["例句2"]),
    example_translation_2: ensureString(row["翻譯2"]),
    example_sentence_3: ensureString(row["例句3"]),
    example_translation_3: ensureString(row["翻譯3"]),
    example_sentence_4: ensureString(row["例句4"]),
    example_translation_4: ensureString(row["翻譯4"]),
    example_sentence_5: ensureString(row["例句5"]),
    example_translation_5: ensureString(row["翻譯5"]),
    pos: normalizedPos || undefined,
    posTags,
    posOriginal, // Keep original format like "(adj./n./v.)" for display
    stage: ensureString(row.stage),
    level: ensureString(row.level),
    cefr: ensureString(row.CEFR || row.cefr),
    textbook_index: textbookIndex,
    version: firstTextbook.version,
    vol: firstTextbook.vol,
    lesson: firstTextbook.lesson,
    kk_phonetic: ensureString(row["KK音標"] || row.kk_phonetic),
    word_forms: ensureString(row["詞形變化"] || row.word_forms),
    phrases,
    synonyms,
    antonyms,
    confusables,
    affix_info: affixInfo,
    videoUrl: ensureString(row.videoUrl || row.video_url),
    themes,
    theme: themes[0] || "",
    theme_index: themeIndex.length > 0 ? themeIndex : undefined,
    exam_tags: row.exam_tags ? [ensureString(row.exam_tags)] : [],
    year_1: ensureString(row.Year_1 || row.year_1),
    part_1: ensureString(row.Part_1 || row.part_1),
    source_1: ensureString(row.Source_1 || row.source_1),
  };
}

/**
 * CSVDataService - Main class for vocabulary data loading
 *
 * 使用 Google Apps Script 作為代理，隱藏 Google Sheet URL
 */
export class CSVDataService {
  private cache: IndexedDBCache;

  constructor() {
    this.cache = new IndexedDBCache("wordgym-vocabulary", "vocabulary-store");
  }

  /**
   * Load vocabulary data from GAS (with caching)
   * Returns cached data if fresh, otherwise fetches from GAS
   */
  async loadData(forceRefresh = false): Promise<CSVDataResult> {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = await this.cache.get<{
        data: VocabularyWord[];
        timestamp: number;
      }>("vocabulary-data");

      if (cached && cached.data && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_EXPIRY_MS) {
          console.log(
            `[CSVDataService] 使用快取資料 (${Math.round(age / 60000)} 分鐘前)`,
          );
          return {
            data: cached.data,
            fromCache: true,
            cacheAge: age,
          };
        }
      }
    }

    // Fetch from GAS
    console.log("[CSVDataService] 從 Google Apps Script 載入資料...");

    try {
      const response = await fetch(GAS_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      console.log(`[CSVDataService] 收到 ${jsonData.length} 筆資料`);

      // Convert to VocabularyWord format
      const data: VocabularyWord[] = jsonData.map(
        (row: any, index: number) => convertToVocabularyWord(row, index),
      );

      // Normalize stage values to match VersionService convention
      // VersionService uses: 高中 -> "high", 國中 -> "junior"
      const normalizedData = data.map((word) => ({
        ...word,
        stage:
          word.stage === "高中" || word.stage === "senior" || word.stage === "high"
            ? "high"
            : word.stage === "國中" || word.stage === "junior"
              ? "junior"
              : word.stage,
      }));

      console.log(`[CSVDataService] 轉換完成: ${normalizedData.length} 筆單字`);

      // Save to cache
      await this.cache.set("vocabulary-data", {
        data: normalizedData,
        timestamp: Date.now(),
      });

      return {
        data: normalizedData,
        fromCache: false,
      };
    } catch (error) {
      console.error("[CSVDataService] 載入失敗:", error);

      // Try to return cached data even if expired
      const cached = await this.cache.get<{
        data: VocabularyWord[];
        timestamp: number;
      }>("vocabulary-data");

      if (cached && cached.data) {
        console.log("[CSVDataService] 使用過期快取作為備援");
        return {
          data: cached.data,
          fromCache: true,
          cacheAge: cached.timestamp ? Date.now() - cached.timestamp : undefined,
        };
      }

      throw error;
    }
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    await this.cache.delete("vocabulary-data");
    console.log("[CSVDataService] 快取已清除");
  }
}

// Export singleton instance for backwards compatibility
export const csvDataService = new CSVDataService();
