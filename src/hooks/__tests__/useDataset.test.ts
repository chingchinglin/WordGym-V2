/**
 * useDataset Hook Tests
 * Issue #72: Test data loading and cache management
 */

import { renderHook, act } from "@testing-library/react-hooks/pure";

// waitFor helper for testing async hooks
const waitFor = async (
  callback: () => void | Promise<void>,
  options?: { timeout?: number },
) => {
  const timeout = options?.timeout || 1000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await callback();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error("waitFor timed out");
};

// Mock CSVDataService
jest.mock("../../services/CSVDataService", () => ({
  csvDataService: {
    loadData: jest.fn(),
    getCacheInfo: jest.fn(),
    clearCache: jest.fn(),
  },
  CSVDataResult: {},
}));

// Mock vocabulary.json fallback
jest.mock("../../data/vocabulary.json", () => [
  {
    id: 1,
    english_word: "apple",
    chinese_definition: "蘋果",
    stage: "junior",
  },
  {
    id: 2,
    english_word: "book",
    chinese_definition: "書",
    stage: "senior",
  },
]);

import { useDataset } from "../useDataset";
import { csvDataService } from "../../services/CSVDataService";

describe("useDataset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Default mock implementation
    (csvDataService.loadData as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 1,
          english_word: "hello",
          chinese_definition: "你好",
          stage: "junior",
        },
        {
          id: 2,
          english_word: "world",
          chinese_definition: "世界",
          stage: "senior",
        },
      ],
      fromCache: false,
      cacheAge: undefined,
    });
  });

  describe("Initialization", () => {
    it("should initialize with fallback data", () => {
      const { result } = renderHook(() => useDataset());

      // Initially loads fallback data
      expect(result.current.data.length).toBeGreaterThan(0);
    });

    it("should set isLoading to true initially", () => {
      const { result } = renderHook(() => useDataset());

      // Cache info starts with isLoading true
      expect(result.current.cacheInfo.isLoading).toBe(true);
    });
  });

  describe("CSV Loading", () => {
    it("should load data from CSV service", async () => {
      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      expect(csvDataService.loadData).toHaveBeenCalledWith(false);
    });

    it("should update data after CSV load", async () => {
      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      // Data should be updated from CSV
      expect(result.current.data.some((w) => w.english_word === "hello")).toBe(
        true,
      );
    });

    it("should set fromCache correctly", async () => {
      (csvDataService.loadData as jest.Mock).mockResolvedValue({
        data: [{ id: 1, english_word: "test", chinese_definition: "測試" }],
        fromCache: true,
        cacheAge: 1000 * 60 * 30, // 30 minutes
      });

      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      expect(result.current.cacheInfo.fromCache).toBe(true);
      expect(result.current.cacheInfo.cacheAge).toBe(1000 * 60 * 30);
    });
  });

  describe("refreshCache", () => {
    it("should force refresh data", async () => {
      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      // Clear mock calls from initial load
      (csvDataService.loadData as jest.Mock).mockClear();

      // Refresh cache
      await act(async () => {
        await result.current.refreshCache();
      });

      expect(csvDataService.loadData).toHaveBeenCalledWith(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle CSV load error gracefully", async () => {
      (csvDataService.loadData as jest.Mock).mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      // Should still have fallback data
      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.cacheInfo.error).toBe("Network error");
    });
  });

  describe("importRows", () => {
    it("should add new words", async () => {
      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      const initialLength = result.current.data.length;

      act(() => {
        result.current.importRows([
          {
            english_word: "newword",
            chinese_definition: "新詞",
            stage: "junior",
          },
        ]);
      });

      expect(result.current.data.length).toBe(initialLength + 1);
    });

    it("should merge existing words by composite key", async () => {
      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      const initialLength = result.current.data.length;

      // Import word with same english_word but same stage - should merge
      act(() => {
        result.current.importRows([
          {
            english_word: "hello",
            chinese_definition: "哈囉",
            stage: "junior",
            synonyms: ["hi", "hey"],
          },
        ]);
      });

      // Length should stay same (merged)
      expect(result.current.data.length).toBe(initialLength);

      // Synonyms should be merged
      const helloWord = result.current.data.find(
        (w) => w.english_word === "hello",
      );
      expect(helloWord?.synonyms).toContain("hi");
    });

    it("should not merge words from different stages", async () => {
      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      const initialLength = result.current.data.length;

      // Import word with same english_word but different stage
      act(() => {
        result.current.importRows([
          {
            english_word: "hello",
            chinese_definition: "哈囉（高中版）",
            stage: "senior",
          },
        ]);
      });

      // Should add as new word (different stage = different composite key)
      expect(result.current.data.length).toBe(initialLength + 1);
    });
  });

  describe("reset", () => {
    it("should reset dataset to empty", async () => {
      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data.length).toBe(0);
    });
  });

  describe("Data Hydration", () => {
    it("should ensure all words have id", async () => {
      (csvDataService.loadData as jest.Mock).mockResolvedValue({
        data: [
          { english_word: "test1", chinese_definition: "測試1" },
          { english_word: "test2", chinese_definition: "測試2" },
        ],
        fromCache: false,
      });

      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      result.current.data.forEach((word) => {
        expect(word.id).toBeDefined();
      });
    });

    it("should normalize word_forms_detail", async () => {
      (csvDataService.loadData as jest.Mock).mockResolvedValue({
        data: [
          {
            english_word: "run",
            chinese_definition: "跑",
            word_forms: "runs, ran, running",
          },
        ],
        fromCache: false,
      });

      const { result } = renderHook(() => useDataset());

      await waitFor(() => {
        expect(result.current.cacheInfo.isLoading).toBe(false);
      });

      const runWord = result.current.data.find((w) => w.english_word === "run");
      expect(runWord?.word_forms_detail).toBeDefined();
    });
  });
});
