import { useState, useEffect } from "react";
import { FEATURES } from "../config/features";

type TabType = "textbook" | "exam" | "theme";

const LOCAL_STORAGE_KEY = "wordgym_current_tab_v1";

/**
 * 檢查 tab 是否啟用
 */
function isTabEnabled(tab: TabType): boolean {
  if (tab === "textbook") return FEATURES.textbook;
  if (tab === "exam") return FEATURES.exam;
  if (tab === "theme") return FEATURES.theme;
  return true;
}

export const useCurrentTab = () => {
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const storedTab = localStorage.getItem(LOCAL_STORAGE_KEY) as TabType | null;
    const initialTab = storedTab || "textbook";
    
    // 如果讀到的 tab 是鎖定的（從 localStorage 恢復），自動切換到 textbook
    // 這樣可以避免用戶重新載入頁面時看到 Coming Soon
    if (!isTabEnabled(initialTab)) {
      return "textbook";
    }
    
    return initialTab;
  });

  useEffect(() => {
    // 只保存啟用的 tab，避免保存鎖定的 tab
    if (isTabEnabled(currentTab)) {
      localStorage.setItem(LOCAL_STORAGE_KEY, currentTab);
    }
  }, [currentTab]);

  return { currentTab, setCurrentTab };
};
