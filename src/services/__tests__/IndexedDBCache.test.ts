/**
 * IndexedDBCache Tests
 * Issue #72: Test IndexedDB caching functionality
 */

// Mock IndexedDB
const mockObjectStore = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
};

const mockDB = {
  transaction: jest.fn(() => mockTransaction),
  objectStoreNames: { contains: jest.fn(() => true) },
  createObjectStore: jest.fn(),
  close: jest.fn(),
};

const mockOpenRequest: {
  result: typeof mockDB;
  onerror: ((event: any) => void) | null;
  onsuccess: ((event: any) => void) | null;
  onupgradeneeded: ((event: any) => void) | null;
} = {
  result: mockDB,
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
};

// Mock indexedDB global
const mockIndexedDB = {
  open: jest.fn(() => {
    setTimeout(() => {
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess({ target: mockOpenRequest });
      }
    }, 0);
    return mockOpenRequest;
  }),
};

Object.defineProperty(global, "indexedDB", {
  value: mockIndexedDB,
  writable: true,
});

import { IndexedDBCache } from "../IndexedDBCache";

describe("IndexedDBCache", () => {
  let cache: IndexedDBCache;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new IndexedDBCache("test-db", "test-store");
  });

  describe("Constructor", () => {
    it("should create instance with correct db and store names", () => {
      expect(cache).toBeInstanceOf(IndexedDBCache);
    });
  });

  describe("get", () => {
    it("should return data when key exists", async () => {
      const testData = { value: "test" };
      const mockRequest = {
        result: testData,
        onerror: null as any,
        onsuccess: null as any,
      };

      mockObjectStore.get.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({ target: mockRequest });
          }
        }, 0);
        return mockRequest;
      });

      const result = await cache.get("testKey");
      expect(result).toEqual(testData);
    });

    it("should return null when key does not exist", async () => {
      const mockRequest = {
        result: undefined,
        onerror: null as any,
        onsuccess: null as any,
      };

      mockObjectStore.get.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({ target: mockRequest });
          }
        }, 0);
        return mockRequest;
      });

      const result = await cache.get("nonExistentKey");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should store data with key", async () => {
      const testData = { value: "test" };
      const mockRequest = {
        onerror: null as any,
        onsuccess: null as any,
      };

      mockObjectStore.put.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({});
          }
        }, 0);
        return mockRequest;
      });

      await cache.set("testKey", testData);
      expect(mockObjectStore.put).toHaveBeenCalledWith(testData, "testKey");
    });
  });

  describe("delete", () => {
    it("should delete data by key", async () => {
      const mockRequest = {
        onerror: null as any,
        onsuccess: null as any,
      };

      mockObjectStore.delete.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({});
          }
        }, 0);
        return mockRequest;
      });

      await cache.delete("testKey");
      expect(mockObjectStore.delete).toHaveBeenCalledWith("testKey");
    });
  });

  describe("clear", () => {
    it("should clear all data", async () => {
      const mockRequest = {
        onerror: null as any,
        onsuccess: null as any,
      };

      mockObjectStore.clear.mockImplementation(() => {
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({});
          }
        }, 0);
        return mockRequest;
      });

      await cache.clear();
      expect(mockObjectStore.clear).toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle database open error", async () => {
      const errorCache = new IndexedDBCache("error-db", "error-store");

      mockIndexedDB.open.mockImplementationOnce(() => {
        const errorRequest: {
          result: null;
          onerror: ((event: any) => void) | null;
          onsuccess: ((event: any) => void) | null;
          onupgradeneeded: ((event: any) => void) | null;
        } = {
          result: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
        };
        setTimeout(() => {
          if (errorRequest.onerror) {
            errorRequest.onerror({ target: { error: new Error("DB Error") } });
          }
        }, 0);
        return errorRequest;
      });

      // The error should be caught and return null
      const result = await errorCache.get("key");
      expect(result).toBeNull();
    });
  });
});
