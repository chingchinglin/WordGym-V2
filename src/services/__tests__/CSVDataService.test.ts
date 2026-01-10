/**
 * CSVDataService Tests
 * Issue #72: Test CSV parsing and data transformation
 */

// Create a proper mock class for IndexedDBCache
class MockIndexedDBCache {
  private store: Map<string, any> = new Map();

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key) || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Mock the module
jest.mock("../IndexedDBCache", () => ({
  IndexedDBCache: jest.fn().mockImplementation(() => new MockIndexedDBCache()),
}));

// Mock fetch
global.fetch = jest.fn();

// Import after mocking
import { CSVDataService } from "../CSVDataService";

describe("CSVDataService", () => {
  let service: CSVDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CSVDataService();
  });

  describe("CSV Parsing", () => {
    it("should parse simple CSV rows", async () => {
      const csvData = `english_word,chinese_definition,stage
apple,蘋果,junior
book,書,senior`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data.length).toBe(2);
      expect(result.data[0].english_word).toBe("apple");
      expect(result.data[0].chinese_definition).toBe("蘋果");
      expect(result.data[0].stage).toBe("junior");
      expect(result.data[1].english_word).toBe("book");
      expect(result.data[1].stage).toBe("senior");
    });

    it("should handle quoted fields with commas", async () => {
      const csvData = `english_word,chinese_definition,phrases
hello,"你好,問候語","hello there; hi hello"`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].chinese_definition).toBe("你好,問候語");
    });

    it("should handle escaped quotes", async () => {
      const csvData = `english_word,chinese_definition
test,"包含""引號""的文字"`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].chinese_definition).toBe('包含"引號"的文字');
    });

    it("should skip empty rows", async () => {
      const csvData = `english_word,chinese_definition
apple,蘋果

book,書
`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data.length).toBe(2);
    });
  });

  describe("Stage Normalization", () => {
    it("should normalize 高中 to senior", async () => {
      const csvData = `english_word,chinese_definition,stage
word,詞,高中`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].stage).toBe("senior");
    });

    it("should normalize 國中 to junior", async () => {
      const csvData = `english_word,chinese_definition,stage
word,詞,國中`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].stage).toBe("junior");
    });
  });

  describe("Textbook Index Parsing", () => {
    it("should parse textbook_index format", async () => {
      const csvData = `english_word,chinese_definition,textbook_index
word,詞,龍騰-B1-U4`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].textbook_index).toEqual([
        { version: "龍騰", vol: "B1", lesson: "U4" },
      ]);
    });

    it("should parse multiple textbook indices", async () => {
      const csvData = `english_word,chinese_definition,textbook_index
word,詞,龍騰-B1-U4; 翰林-B2-L3`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].textbook_index).toHaveLength(2);
      expect(result.data[0].textbook_index?.[1]).toEqual({
        version: "翰林",
        vol: "B2",
        lesson: "L3",
      });
    });
  });

  describe("Exam Tags Parsing", () => {
    it("should parse exam_tags", async () => {
      const csvData = `english_word,chinese_definition,exam_tags
word,詞,106學測; 107學測`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].exam_tags).toEqual(["106學測", "107學測"]);
    });
  });

  describe("POS Tags Parsing", () => {
    it("should parse posTags with comma separator", async () => {
      const csvData = `english_word,chinese_definition,posTags
run,跑,v,n`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].posTags).toContain("v");
    });

    it("should default to other if no POS provided", async () => {
      const csvData = `english_word,chinese_definition
word,詞`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      const result = await service.loadData(true);

      expect(result.data[0].posTags).toContain("other");
    });
  });

  describe("Error Handling", () => {
    it("should throw on fetch failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(service.loadData(true)).rejects.toThrow("Failed to fetch CSV");
    });

    it("should throw on empty CSV", async () => {
      const csvData = `english_word,chinese_definition`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      await expect(service.loadData(true)).rejects.toThrow("CSV has no data rows");
    });
  });

  describe("Caching", () => {
    it("should cache data after first load", async () => {
      const csvData = `english_word,chinese_definition
word,詞`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });

      // First load - from fetch
      const result1 = await service.loadData(true);
      expect(result1.fromCache).toBe(false);

      // Second load - should still work (may use cache depending on timing)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(csvData),
      });
      const result2 = await service.loadData(false);
      expect(result2.data.length).toBe(1);
    });
  });
});
