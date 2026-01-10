/**
 * useUserExamples Hook - User-Added Example Sentences
 * Migrated from index.html lines 1440-1462
 */

import { useState, useEffect } from "react";
import type { UserExamplesStore, UserExample } from "../types";

const LS_KEY = "mvp_vocab_user_examples_v1";

export function useUserExamples() {
  const [userExamples, setUserExamples] = useState<UserExamplesStore>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" ? parsed : {};
      }
    } catch {
      /* localStorage may be unavailable */
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(userExamples));
    } catch (e) {
      console.error("Failed to save user examples:", e);
    }
  }, [userExamples]);

  const addExample = (
    wordId: number,
    example: Omit<UserExample, "createdAt" | "source">,
  ) => {
    const newExample: UserExample = {
      ...example,
      source: "user",
      createdAt: new Date().toISOString(),
    };

    setUserExamples((prev) => ({
      ...prev,
      [wordId]: [...(prev[wordId] || []), newExample],
    }));
  };

  const deleteExample = (wordId: number, index: number) => {
    setUserExamples((prev) => {
      const examples = prev[wordId] || [];
      const updated = examples.filter((_, i) => i !== index);
      if (updated.length === 0) {
        const { [wordId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [wordId]: updated };
    });
  };

  const getExamples = (wordId: number): UserExample[] => {
    return userExamples[wordId] || [];
  };

  return {
    userExamples,
    addExample,
    deleteExample,
    getExamples,
  };
}
