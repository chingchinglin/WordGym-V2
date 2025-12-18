/**
 * Vocabulary type definitions
 */

export interface VocabularyWord {
  id: string;
  english_word: string;
  chinese_translation?: string;
  kk_phonetic?: string;
  level?: string;
  posTags?: string[];
  themes?: string[];
  example_sentence?: string;
  example_translation?: string;
}

export type POSType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'other';

export interface FilterOptions {
  searchTerm: string;
  posFilter: POSType | 'all';
  levelFilter: string;
  themeFilter: string;
}

export interface StudySession {
  wordId: string;
  timestamp: number;
  correct: boolean;
}
