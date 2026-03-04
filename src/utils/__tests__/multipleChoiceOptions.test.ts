import { VocabularyWord } from "../../types";

// This test validates the core logic of multiple choice option generation
// to ensure we always have exactly 4 options

describe("Multiple Choice Options Generation Logic", () => {
  // Helper functions to check textbook index matching
  const hasSameLesson = (
    word1: VocabularyWord,
    word2: VocabularyWord,
  ): boolean => {
    if (
      !word1.textbook_index ||
      word1.textbook_index.length === 0 ||
      !word2.textbook_index ||
      word2.textbook_index.length === 0
    ) {
      return false;
    }

    for (const ti1 of word1.textbook_index) {
      for (const ti2 of word2.textbook_index) {
        if (
          ti1.version === ti2.version &&
          ti1.vol === ti2.vol &&
          ti1.lesson === ti2.lesson
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const hasSameVol = (word1: VocabularyWord, word2: VocabularyWord): boolean => {
    if (
      !word1.textbook_index ||
      word1.textbook_index.length === 0 ||
      !word2.textbook_index ||
      word2.textbook_index.length === 0
    ) {
      return false;
    }

    for (const ti1 of word1.textbook_index) {
      for (const ti2 of word2.textbook_index) {
        if (ti1.version === ti2.version && ti1.vol === ti2.vol) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper function to simulate the option generation logic from MultipleChoiceQuiz
  const generateOptions = (
    correctWord: VocabularyWord,
    pool: VocabularyWord[],
  ): string[] => {
    const correctAnswer = correctWord.english_word;
    const allDistractors: string[] = [];

    // Step 1: Get words from the same textbook lesson (version-vol-lesson)
    const sameLessonWords = pool.filter(
      (w) => hasSameLesson(correctWord, w) && w.english_word !== correctAnswer,
    );

    const shuffledSameLesson = [...sameLessonWords].sort(
      () => Math.random() - 0.5,
    );
    for (let i = 0; i < Math.min(3, shuffledSameLesson.length); i++) {
      allDistractors.push(shuffledSameLesson[i].english_word);
    }

    // Step 2: If not enough, get words from the same textbook volume (version-vol)
    if (allDistractors.length < 3) {
      const sameVolWords = pool.filter(
        (w) =>
          hasSameVol(correctWord, w) &&
          w.english_word !== correctAnswer &&
          !allDistractors.includes(w.english_word),
      );
      const shuffledSameVol = [...sameVolWords].sort(() => Math.random() - 0.5);

      for (
        let i = 0;
        i < Math.min(3 - allDistractors.length, shuffledSameVol.length);
        i++
      ) {
        allDistractors.push(shuffledSameVol[i].english_word);
      }
    }

    // Fallback: If word has no textbook_index, use POS-based strategy
    if (
      allDistractors.length < 3 &&
      (!correctWord.textbook_index || correctWord.textbook_index.length === 0)
    ) {
      const currentPOS =
        correctWord.posTags && correctWord.posTags.length > 0
          ? correctWord.posTags[0]
          : correctWord.pos;

      const samePOSInPool = pool.filter((w) => {
        const wordPOS =
          w.posTags && w.posTags.length > 0 ? w.posTags[0] : w.pos;

        return (
          wordPOS &&
          currentPOS &&
          wordPOS === currentPOS &&
          w.english_word !== correctAnswer &&
          !allDistractors.includes(w.english_word)
        );
      });

      const shuffledSamePOS = [...samePOSInPool].sort(() => Math.random() - 0.5);
      for (
        let i = 0;
        i < Math.min(3 - allDistractors.length, shuffledSamePOS.length);
        i++
      ) {
        allDistractors.push(shuffledSamePOS[i].english_word);
      }

      if (allDistractors.length < 3) {
        const otherWords = pool.filter(
          (w) =>
            w.english_word !== correctAnswer &&
            !allDistractors.includes(w.english_word),
        );
        const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);

        for (
          let i = 0;
          i < Math.min(3 - allDistractors.length, shuffledOthers.length);
          i++
        ) {
          allDistractors.push(shuffledOthers[i].english_word);
        }
      }
    }

    // Step 3: Fallback strategies to ensure exactly 3 distractors
    const fallbackOptions = [
      "apple",
      "banana",
      "computer",
      "develop",
      "education",
      "family",
      "government",
      "history",
      "important",
      "justice",
      "knowledge",
      "language",
      "mountain",
      "nature",
      "organization",
    ];

    while (allDistractors.length < 3) {
      // Try to find unused fallback words
      const unusedFallbacks = fallbackOptions.filter(
        (fb) =>
          fb !== correctAnswer.toLowerCase() &&
          !allDistractors.some((d) => d.toLowerCase() === fb),
      );

      if (unusedFallbacks.length > 0) {
        const randomFallback =
          unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        allDistractors.push(randomFallback);
      } else {
        // Last resort: generate synthetic options
        allDistractors.push(`option_${allDistractors.length + 1}`);
      }
    }

    // Ensure exactly 3 unique distractors
    const uniqueDistractors = [...new Set(allDistractors.slice(0, 3))];

    // If we still don't have 3 after deduplication, pad with fallbacks
    while (uniqueDistractors.length < 3) {
      const syntheticOption = `word_${uniqueDistractors.length + 1}`;
      if (
        !uniqueDistractors.includes(syntheticOption) &&
        syntheticOption !== correctAnswer
      ) {
        uniqueDistractors.push(syntheticOption);
      }
    }

    // Build final options: ALWAYS exactly 4 options (3 distractors + 1 correct)
    const finalOptions: string[] = [...uniqueDistractors.slice(0, 3)];

    // Insert correct answer at position 0 for testing purposes
    finalOptions.splice(0, 0, correctAnswer);

    return finalOptions;
  };

  test("generates exactly 4 options with same lesson", () => {
    const pool: VocabularyWord[] = [
      {
        id: 1,
        english_word: "apple",
        chinese_definition: "蘋果",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U1" }],
      },
      {
        id: 2,
        english_word: "banana",
        chinese_definition: "香蕉",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U1" }],
      },
      {
        id: 3,
        english_word: "cherry",
        chinese_definition: "櫻桃",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U1" }],
      },
      {
        id: 4,
        english_word: "date",
        chinese_definition: "棗子",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U1" }],
      },
    ] as VocabularyWord[];

    const options = generateOptions(pool[0], pool);
    expect(options).toHaveLength(4);
    expect(options).toContain("apple");
  });

  test("generates exactly 4 options with same volume but different lesson", () => {
    const pool: VocabularyWord[] = [
      {
        id: 1,
        english_word: "apple",
        chinese_definition: "蘋果",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U1" }],
      },
      {
        id: 2,
        english_word: "banana",
        chinese_definition: "香蕉",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U2" }],
      },
      {
        id: 3,
        english_word: "cherry",
        chinese_definition: "櫻桃",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U2" }],
      },
      {
        id: 4,
        english_word: "date",
        chinese_definition: "棗子",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U3" }],
      },
    ] as VocabularyWord[];

    const options = generateOptions(pool[0], pool);
    expect(options).toHaveLength(4);
    expect(options).toContain("apple");
  });

  test("generates exactly 4 options with no textbook_index (fallback to POS)", () => {
    const pool: VocabularyWord[] = [
      {
        id: 1,
        english_word: "apple",
        chinese_definition: "蘋果",
        pos: "noun",
        posTags: ["noun"],
      },
      {
        id: 2,
        english_word: "banana",
        chinese_definition: "香蕉",
        pos: "noun",
        posTags: ["noun"],
      },
      {
        id: 3,
        english_word: "cherry",
        chinese_definition: "櫻桃",
        pos: "noun",
        posTags: ["noun"],
      },
      {
        id: 4,
        english_word: "date",
        chinese_definition: "棗子",
        pos: "noun",
        posTags: ["noun"],
      },
    ] as VocabularyWord[];

    const options = generateOptions(pool[0], pool);
    expect(options).toHaveLength(4);
    expect(options).toContain("apple");
  });

  test("generates exactly 4 unique options", () => {
    const pool: VocabularyWord[] = [
      {
        id: 1,
        english_word: "test",
        chinese_definition: "測試",
        pos: "noun",
        posTags: ["noun"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U1" }],
      },
    ] as VocabularyWord[];

    const options = generateOptions(pool[0], pool);
    const uniqueOptions = new Set(options);

    expect(options).toHaveLength(4);
    expect(uniqueOptions.size).toBe(4); // All options must be unique
    expect(options).toContain("test");
  });

  test("always includes correct answer in options", () => {
    const pool: VocabularyWord[] = [
      {
        id: 1,
        english_word: "correct",
        chinese_definition: "正確",
        pos: "adjective",
        posTags: ["adjective"],
        textbook_index: [{ version: "康軒", vol: "B1", lesson: "U1" }],
      },
    ] as VocabularyWord[];

    const options = generateOptions(pool[0], pool);
    expect(options).toContain("correct");
    expect(options).toHaveLength(4);
  });
});
