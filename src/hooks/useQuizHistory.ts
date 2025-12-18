/**
 * useQuizHistory Hook - Quiz History Management
 * Migrated from index.html lines 1591-1615
 */

import { useState, useEffect } from 'react';
import type { QuizRecord } from '../types';

const LS_KEY = 'mvp_vocab_quiz_history_v1';

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save quiz history:', e);
    }
  }, [history]);

  const addQuizRecord = (record: QuizRecord) => {
    setHistory(prev => [record, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteRecord = (recordId: string) => {
    setHistory(prev => prev.filter(r => r.id !== recordId));
  };

  return {
    history,
    addQuizRecord,
    clearHistory,
    deleteRecord
  };
}
