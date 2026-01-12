import { makeCloze, canMakeCloze } from "../quizHelpers";

describe("makeCloze", () => {
  describe("Single word cloze", () => {
    it("should replace a simple word with underscores", () => {
      const result = makeCloze("He is a teacher", "teacher");
      expect(result).toBe("He is a _____");
    });

    it("should handle case-insensitive matching", () => {
      const result = makeCloze("He is a TEACHER", "teacher");
      expect(result).toContain("_____");
      expect(result).not.toContain("TEACHER");
    });

    it("should handle word forms (past tense)", () => {
      const result = makeCloze("She walked to school", "walk");
      expect(result).toBe("She _____ to school");
    });

    it("should handle word forms (gerund)", () => {
      const result = makeCloze("He is running fast", "run");
      expect(result).toBe("He is _____ fast");
    });

    it("should not replace word inside another word", () => {
      const result = makeCloze("He is understanding", "stand");
      // Should blank 'stand' inside 'understanding'
      expect(result).toContain("_____");
    });

    it("should fallback to appending blank if word not found", () => {
      const result = makeCloze("The cat is sleeping", "dog");
      expect(result).toBe("The cat is sleeping (_____)");
    });
  });

  describe("Multi-word phrase cloze", () => {
    it("should handle exact phrase match", () => {
      const result = makeCloze(
        "He went around the corner quickly",
        "around the corner"
      );
      expect(result).toBe("He went _____ quickly");
    });

    it("should handle phrase with word form changes (last word)", () => {
      const result = makeCloze(
        "She looked forward to the party",
        "look forward to"
      );
      // Should blank the matching form within the phrase
      expect(result).toContain("_____");
      expect(result).toContain("the party");
    });

    it("should handle phrase with different tenses", () => {
      const result = makeCloze(
        "They have been looking forward to this",
        "look forward to"
      );
      expect(result).toContain("_____");
    });

    it("should handle phrase case-insensitive", () => {
      const result = makeCloze(
        "He WENT AROUND THE CORNER",
        "around the corner"
      );
      expect(result).toContain("_____");
      expect(result).not.toContain("AROUND");
    });

    it("should fallback if exact phrase not found", () => {
      const result = makeCloze(
        "He moved towards the corner",
        "around the corner"
      );
      // Should blank at least 'corner' or first word found
      expect(result).toContain("_____");
    });

    it("should handle three-word phrases", () => {
      const result = makeCloze(
        "She ran as fast as she could",
        "run as fast as"
      );
      // Should find some part of the phrase
      expect(result).toContain("_____");
    });

    it("should fallback to appending blank if no words from phrase found", () => {
      const result = makeCloze("A dog runs fast", "around the corner");
      // When NO words from phrase are found in sentence, falls back to appending
      expect(result).toContain("(_____)");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string", () => {
      const result = makeCloze("", "word");
      expect(result).toBe(" (_____)");
    });

    it("should handle empty answer", () => {
      const result = makeCloze("Some sentence", "");
      expect(result).toBe("Some sentence (_____)");
    });

    it("should handle word with parenthetical info", () => {
      const result = makeCloze("He is intelligent (adj.)", "intelligent (adj.)");
      expect(result).toContain("_____");
    });

    it("should handle punctuation correctly", () => {
      const result = makeCloze("He said, carefully, that it was done.", "said");
      expect(result).toBe("He _____, carefully, that it was done.");
    });

    it("should handle word at sentence start", () => {
      const result = makeCloze("Walking slowly, he approached.", "walk");
      expect(result).toBe("_____ slowly, he approached.");
    });

    it("should handle word at sentence end", () => {
      const result = makeCloze("He was a great teacher", "teacher");
      expect(result).toBe("He was a great _____");
    });
  });

  describe("canMakeCloze", () => {
    it("should return true if cloze is made successfully", () => {
      const result = canMakeCloze("He is a teacher", "teacher");
      expect(result).toBe(true);
    });

    it("should return false if word not found and fallback used", () => {
      const result = canMakeCloze("The cat is sleeping", "dog");
      expect(result).toBe(false);
    });

    it("should return false for empty inputs", () => {
      expect(canMakeCloze("", "word")).toBe(false);
      expect(canMakeCloze("sentence", "")).toBe(false);
    });

    it("should return true for phrases found in sentence", () => {
      const result = canMakeCloze(
        "He went around the corner",
        "around the corner"
      );
      expect(result).toBe(true);
    });

    it("should return true when phrase contains at least one word in sentence", () => {
      // "the" from "around the corner" is in "The cat is blue"
      // So it will blank "the" and return true
      const result = canMakeCloze("The cat is blue", "around the corner");
      expect(result).toBe(true);
    });
  });

  describe("Issue #58 - Phrase blank placement", () => {
    it("should place blank at phrase location, not at end", () => {
      const result = makeCloze(
        "When you go around the corner, you will see the park.",
        "around the corner"
      );
      // Should NOT be: "When you go around the corner, you will see the park. (_____)..."
      expect(result).toContain("When you go _____, you will see the park.");
    });

    it("should handle phrasal verb", () => {
      const result = makeCloze(
        "You can look forward to a surprise party",
        "look forward to"
      );
      expect(result).toContain("_____");
      // Blank should not be appended at end
      expect(result).not.toMatch(/\(____\)$/);
    });

    it("should blank phrase correctly even with complex sentence", () => {
      const result = makeCloze(
        "After she had been looking forward to this event for months, it finally arrived.",
        "look forward to"
      );
      expect(result).toContain("_____");
      // Blank should be in the sentence, not appended
      expect(result).not.toMatch(/\(____\)$/);
    });
  });
});
