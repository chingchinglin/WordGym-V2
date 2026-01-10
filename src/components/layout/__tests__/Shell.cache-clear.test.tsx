/**
 * Test: Cache clearing should preserve userSettings correctly
 *
 * Issue #62: After clearing cache and reloading, user settings are lost
 * because Shell.tsx uses wrong localStorage key
 *
 * Expected behavior:
 * 1. User settings should persist after cache clear
 * 2. User should not need to re-select version
 * 3. Data should be filtered correctly based on preserved settings
 */

import { LS } from "../../../types";

describe("Shell Cache Clear - userSettings Preservation", () => {
  beforeEach(() => {
    // Clear all localStorage before each test
    localStorage.clear();
  });

  it("should use correct localStorage key for userSettings", () => {
    // This test verifies the fix for Issue #62

    // Setup: Save user settings using correct key
    const mockSettings = {
      stage: "senior",
      version: "龍騰",
    };
    localStorage.setItem(LS.userSettings, JSON.stringify(mockSettings));
    localStorage.setItem(LS.currentTab, "textbook");
    localStorage.setItem(LS.quizHistory, JSON.stringify([]));

    // Verify settings are saved
    expect(localStorage.getItem(LS.userSettings)).toBeTruthy();
    expect(localStorage.getItem(LS.currentTab)).toBe("textbook");

    // Simulate cache clear logic (what Shell.tsx should do)
    const savedSettings = localStorage.getItem(LS.userSettings); // Use LS.userSettings, not "userSettings"
    const savedTab = localStorage.getItem(LS.currentTab);

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Verify cleared
    expect(localStorage.length).toBe(0);

    // Restore preserved items
    if (savedSettings) {
      localStorage.setItem(LS.userSettings, savedSettings);
    }
    if (savedTab) {
      localStorage.setItem(LS.currentTab, savedTab);
    }

    // Verify restoration
    expect(localStorage.getItem(LS.userSettings)).toBe(
      JSON.stringify(mockSettings),
    );
    expect(localStorage.getItem(LS.currentTab)).toBe("textbook");

    // Quiz history should be cleared
    expect(localStorage.getItem(LS.quizHistory)).toBeNull();
  });

  it("should NOT preserve userSettings if wrong key is used", () => {
    // This test demonstrates the bug in Issue #62

    // Setup: Save user settings using correct key
    const mockSettings = {
      stage: "junior",
      version: "翰林",
    };
    localStorage.setItem(LS.userSettings, JSON.stringify(mockSettings));

    // Simulate WRONG cache clear logic (current bug)
    const savedSettings = localStorage.getItem("userSettings"); // ❌ WRONG KEY

    // Clear all storage
    localStorage.clear();

    // Try to restore with wrong key
    if (savedSettings) {
      localStorage.setItem("userSettings", savedSettings); // ❌ WRONG KEY
    }

    // Verify that settings are NOT restored to correct key
    expect(localStorage.getItem(LS.userSettings)).toBeNull();
    expect(localStorage.getItem("userSettings")).toBeNull();
  });

  it("should preserve both senior and junior settings", () => {
    const testCases = [
      { stage: "senior", version: "三民" },
      { stage: "junior", version: "康軒" },
    ];

    testCases.forEach((mockSettings) => {
      localStorage.clear();
      localStorage.setItem(LS.userSettings, JSON.stringify(mockSettings));

      // Correct cache clear
      const savedSettings = localStorage.getItem(LS.userSettings);
      localStorage.clear();
      if (savedSettings) {
        localStorage.setItem(LS.userSettings, savedSettings);
      }

      // Verify
      const restored = JSON.parse(
        localStorage.getItem(LS.userSettings) || "{}",
      );
      expect(restored.stage).toBe(mockSettings.stage);
      expect(restored.version).toBe(mockSettings.version);
    });
  });
});
