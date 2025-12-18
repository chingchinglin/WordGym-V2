/**
 * useUserSettings Hook - User Preferences (Stage & Textbook Version)
 * Migrated from index.html lines 1507-1529
 */

import { useState, useEffect } from 'react';
import type { UserSettings } from '../types';

const LS_KEY = 'wordgym_user_settings_v1';

const DEFAULT_SETTINGS: UserSettings = {
  stage: 'senior',
  version: ''
};

export function useUserSettings() {
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(userSettings));
    } catch (e) {
      console.error('Failed to save user settings:', e);
    }
  }, [userSettings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...updates }));
  };

  return {
    userSettings,
    setUserSettings,
    updateSettings
  };
}
