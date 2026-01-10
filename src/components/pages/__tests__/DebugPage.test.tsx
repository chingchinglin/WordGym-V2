/**
 * DebugPage Component Tests
 * Issue #72: Test debug page functionality
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DebugPage } from "../DebugPage";
import type { VocabularyWord } from "../../../types";
import type { CacheInfo } from "../../../hooks/useDataset";

// Mock data
const mockWords: VocabularyWord[] = [
  {
    id: 1,
    english_word: "apple",
    english: "apple",
    chinese_definition: "蘋果",
    stage: "junior",
    textbook_index: [{ version: "康軒", vol: "B1", lesson: "L1" }],
  },
  {
    id: 2,
    english_word: "book",
    english: "book",
    chinese_definition: "書",
    stage: "senior",
    textbook_index: [{ version: "龍騰", vol: "B2", lesson: "U3" }],
  },
  {
    id: 3,
    english_word: "cat",
    english: "cat",
    chinese_definition: "貓",
    stage: "junior",
    textbook_index: [],
  },
];

const mockCacheInfo: CacheInfo = {
  isLoading: false,
  fromCache: true,
  cacheAge: 1000 * 60 * 30, // 30 minutes
};

describe("DebugPage", () => {
  describe("Rendering", () => {
    it("should render page title", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      expect(screen.getByText(/Debug/)).toBeInTheDocument();
      expect(screen.getByText(/資料檢查工具/)).toBeInTheDocument();
    });

    it("should display cache status", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      expect(screen.getByText(/快取狀態/)).toBeInTheDocument();
      expect(screen.getByText(/IndexedDB 快取/)).toBeInTheDocument();
    });

    it("should display data statistics", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      expect(screen.getByText(/資料統計/)).toBeInTheDocument();
      expect(screen.getByText(/總詞數/)).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument(); // Total words
    });

    it("should display junior and senior counts", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      // Junior count: 2 (apple, cat)
      // Senior count: 1 (book)
      expect(screen.getByText(/國中 \(junior\)/)).toBeInTheDocument();
      expect(screen.getByText(/高中 \(senior\)/)).toBeInTheDocument();
    });

    it("should display word table", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      expect(screen.getByText("apple")).toBeInTheDocument();
      expect(screen.getByText("book")).toBeInTheDocument();
      expect(screen.getByText("cat")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should filter words by English search term", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      const searchInput = screen.getByPlaceholderText(/搜尋單字/);
      fireEvent.change(searchInput, { target: { value: "apple" } });

      expect(screen.getByText("apple")).toBeInTheDocument();
      expect(screen.queryByText("book")).not.toBeInTheDocument();
      expect(screen.queryByText("cat")).not.toBeInTheDocument();
    });

    it("should filter words by Chinese search term", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      const searchInput = screen.getByPlaceholderText(/搜尋單字/);
      fireEvent.change(searchInput, { target: { value: "蘋果" } });

      expect(screen.getByText("apple")).toBeInTheDocument();
      expect(screen.queryByText("book")).not.toBeInTheDocument();
    });

    it("should show search result count", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      const searchInput = screen.getByPlaceholderText(/搜尋單字/);
      fireEvent.change(searchInput, { target: { value: "a" } });

      // "apple" and "cat" match "a"
      expect(screen.getByText(/2 筆/)).toBeInTheDocument();
    });
  });

  describe("Refresh Button", () => {
    it("should show refresh button when onRefreshCache is provided", () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);

      render(
        <DebugPage
          words={mockWords}
          cacheInfo={mockCacheInfo}
          onRefreshCache={mockRefresh}
        />,
      );

      expect(screen.getByText(/強制刷新資料/)).toBeInTheDocument();
    });

    it("should call onRefreshCache when clicked", async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);

      render(
        <DebugPage
          words={mockWords}
          cacheInfo={mockCacheInfo}
          onRefreshCache={mockRefresh}
        />,
      );

      const refreshButton = screen.getByText(/強制刷新資料/);
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("should show loading state during refresh", async () => {
      const mockRefresh = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );

      render(
        <DebugPage
          words={mockWords}
          cacheInfo={mockCacheInfo}
          onRefreshCache={mockRefresh}
        />,
      );

      const refreshButton = screen.getByText(/強制刷新資料/);
      fireEvent.click(refreshButton);

      expect(screen.getByText(/更新中/)).toBeInTheDocument();
    });
  });

  describe("JSON Display", () => {
    it("should show raw JSON when checkbox is checked", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      const checkbox = screen.getByLabelText(/顯示完整 JSON/);
      fireEvent.click(checkbox);

      expect(screen.getByText(/完整 JSON/)).toBeInTheDocument();
    });

    it("should show word JSON modal when clicking view button", async () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      const viewButtons = screen.getAllByText(/查看 JSON/);
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/的完整資料/)).toBeInTheDocument();
      });
    });
  });

  describe("Cache Age Formatting", () => {
    it("should format cache age in minutes", () => {
      const cacheInfo: CacheInfo = {
        isLoading: false,
        fromCache: true,
        cacheAge: 1000 * 60 * 5, // 5 minutes
      };

      render(<DebugPage words={mockWords} cacheInfo={cacheInfo} />);

      expect(screen.getByText(/5m.*ago/)).toBeInTheDocument();
    });

    it("should format cache age in hours", () => {
      const cacheInfo: CacheInfo = {
        isLoading: false,
        fromCache: true,
        cacheAge: 1000 * 60 * 60 * 2, // 2 hours
      };

      render(<DebugPage words={mockWords} cacheInfo={cacheInfo} />);

      expect(screen.getByText(/2h.*ago/)).toBeInTheDocument();
    });
  });

  describe("Stage Badges", () => {
    it("should display junior badge for junior words", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      const juniorBadges = screen.getAllByText("junior");
      expect(juniorBadges.length).toBeGreaterThan(0);
    });

    it("should display senior badge for senior words", () => {
      render(<DebugPage words={mockWords} cacheInfo={mockCacheInfo} />);

      const seniorBadges = screen.getAllByText("senior");
      expect(seniorBadges.length).toBeGreaterThan(0);
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator in cache status", () => {
      const loadingCacheInfo: CacheInfo = {
        isLoading: true,
        fromCache: false,
      };

      render(<DebugPage words={[]} cacheInfo={loadingCacheInfo} />);

      expect(screen.getByText(/載入中/)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should handle empty words array", () => {
      render(<DebugPage words={[]} cacheInfo={mockCacheInfo} />);

      expect(screen.getByText(/總詞數/)).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
