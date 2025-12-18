/**
 * useFavorites Hook - Manage Favorite Words
 * Migrated from index.html lines 1419-1437
 */

import { useState, useEffect } from 'react';

const LS_KEY = 'mvp_vocab_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch {}
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(Array.from(favorites)));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  const toggleFavorite = (wordId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const isFavorite = (wordId: number): boolean => {
    return favorites.has(wordId);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite
  };
}
