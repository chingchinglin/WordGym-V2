/**
 * useFilters Hook - Tab-specific Filter State
 * Migrated from index.html lines 1547-1589
 */

import { useState, useEffect } from 'react';
import type { Filters, CurrentTab, POSType } from '../types';

const LS_FILTERS = 'wordgym_filters_v1';
const LS_CURRENT_TAB = 'wordgym_current_tab_v1';
const LS_QUICK_FILTER_POS = 'wordgym_quick_filter_pos_v1';

const DEFAULT_FILTERS: Filters = {
  textbook: {},
  exam: {},
  theme: {}
};

export function useFilters() {
  // Current Tab
  const [currentTab, setCurrentTab] = useState<CurrentTab>(() => {
    try {
      const raw = localStorage.getItem(LS_CURRENT_TAB);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed || 'textbook';
      }
    } catch {}
    return 'textbook';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_CURRENT_TAB, JSON.stringify(currentTab));
    } catch (e) {
      console.error('Failed to save current tab:', e);
    }
  }, [currentTab]);

  // Filters
  const [filters, setFilters] = useState<Filters>(() => {
    try {
      const raw = localStorage.getItem(LS_FILTERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_FILTERS, ...parsed };
      }
    } catch {}
    return DEFAULT_FILTERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS, JSON.stringify(filters));
    } catch (e) {
      console.error('Failed to save filters:', e);
    }
  }, [filters]);

  // Quick POS Filter
  const [quickFilterPos, setQuickFilterPos] = useState<POSType | 'all'>(() => {
    try {
      const raw = localStorage.getItem(LS_QUICK_FILTER_POS);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed || 'all';
      }
    } catch {}
    return 'all';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_QUICK_FILTER_POS, JSON.stringify(quickFilterPos));
    } catch (e) {
      console.error('Failed to save quick filter POS:', e);
    }
  }, [quickFilterPos]);

  // Helper functions
  const updateTextbookFilter = (updates: Partial<Filters['textbook']>) => {
    setFilters(prev => ({
      ...prev,
      textbook: { ...prev.textbook, ...updates }
    }));
  };

  const updateExamFilter = (updates: Partial<Filters['exam']>) => {
    setFilters(prev => ({
      ...prev,
      exam: { ...prev.exam, ...updates }
    }));
  };

  const updateThemeFilter = (updates: Partial<Filters['theme']>) => {
    setFilters(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates }
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return {
    currentTab,
    setCurrentTab,
    filters,
    setFilters,
    updateTextbookFilter,
    updateExamFilter,
    updateThemeFilter,
    clearFilters,
    quickFilterPos,
    setQuickFilterPos
  };
}
