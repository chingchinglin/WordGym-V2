/**
 * TTS Audio Cache Service
 * 使用 IndexedDB 持久化快取語音合成的音訊，避免重複的 API 呼叫
 */

import { IndexedDBCache } from './IndexedDBCache';

interface CachedAudio {
  blob: Blob;
  timestamp: number;
  voice: string;
  text: string;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  oldestEntry: number | null;
  newestEntry: number | null;
}

/**
 * TTS 音訊快取服務
 */
export class TTSAudioCache {
  private cache: IndexedDBCache;
  private memoryCache: Map<string, Blob>; // 記憶體快取（快速存取）
  // 預留：未來可用於計算總容量（目前未使用）
  // private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB 最大快取大小
  private readonly MAX_ENTRIES = 1000; // 最多 1000 個快取項目
  private readonly CACHE_EXPIRY_DAYS = 30; // 快取過期時間（天）

  constructor() {
    this.cache = new IndexedDBCache('wordgym-tts-audio', 'audio-store');
    this.memoryCache = new Map();
  }

  /**
   * 生成快取鍵
   */
  private generateCacheKey(voice: string, text: string): string {
    // 正規化文字（移除多餘空白、統一大小寫）
    const normalizedText = text.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${voice}:${normalizedText}`;
  }

  /**
   * 從 IndexedDB 讀取 Blob
   */
  private async getBlobFromIndexedDB(key: string): Promise<Blob | null> {
    try {
      const cached = await this.cache.get<CachedAudio>(key);
      if (!cached) return null;

      // 檢查是否過期
      const age = Date.now() - cached.timestamp;
      const expiryMs = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (age > expiryMs) {
        // 非同步刪除過期項目
        this.cache.delete(key).catch(() => {});
        return null;
      }

      return cached.blob;
    } catch (error) {
      console.error('[TTS Cache] Failed to get from IndexedDB:', error);
      return null;
    }
  }

  /**
   * 儲存 Blob 到 IndexedDB
   */
  private async saveBlobToIndexedDB(key: string, blob: Blob, voice: string, text: string): Promise<void> {
    try {
      const cached: CachedAudio = {
        blob,
        timestamp: Date.now(),
        voice,
        text,
      };
      await this.cache.set(key, cached);
    } catch (error) {
      console.error('[TTS Cache] Failed to save to IndexedDB:', error);
    }
  }

  /**
   * 取得快取的音訊
   * @param voice - 語音名稱
   * @param text - 文字內容
   * @returns 快取的 Blob 或 null
   */
  async get(voice: string, text: string): Promise<Blob | null> {
    const key = this.generateCacheKey(voice, text);

    // 先檢查記憶體快取
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }

    // 從 IndexedDB 讀取
    const blob = await this.getBlobFromIndexedDB(key);
    if (blob) {
      // 同時存入記憶體快取以加速後續存取
      this.memoryCache.set(key, blob);
      return blob;
    }

    return null;
  }

  /**
   * 儲存音訊到快取
   * @param voice - 語音名稱
   * @param text - 文字內容
   * @param blob - 音訊 Blob
   */
  async set(voice: string, text: string, blob: Blob): Promise<void> {
    const key = this.generateCacheKey(voice, text);

    // 存入記憶體快取
    this.memoryCache.set(key, blob);

    // 非同步存入 IndexedDB（不阻塞）
    this.saveBlobToIndexedDB(key, blob, voice, text).catch((error) => {
      console.error('[TTS Cache] Failed to save:', error);
    });

    // 檢查是否需要清理快取
    this.cleanupIfNeeded().catch((error) => {
      console.error('[TTS Cache] Cleanup failed:', error);
    });
  }

  /**
   * 檢查並清理快取（如果超過限制）
   */
  private async cleanupIfNeeded(): Promise<void> {
    try {
      const stats = await this.getStats();
      
      // 如果超過項目數限制，清理最舊的項目
      if (stats.totalEntries > this.MAX_ENTRIES) {
        await this.cleanupOldEntries(this.MAX_ENTRIES - 100); // 保留 100 個
      }
    } catch (error) {
      console.error('[TTS Cache] Cleanup check failed:', error);
    }
  }

  /**
   * 清理最舊的快取項目
   */
  private async cleanupOldEntries(targetCount: number): Promise<void> {
    try {
      // 這裡需要實作清理邏輯
      // 由於 IndexedDBCache 沒有列出所有鍵的功能，我們先清理記憶體快取
      if (this.memoryCache.size > targetCount) {
        const entries = Array.from(this.memoryCache.entries());
        entries.sort((a, b) => {
          // 簡單清理：移除一半最舊的項目
          return 0; // 簡化實作，實際應該根據時間戳排序
        });
        
        const toDelete = entries.slice(0, entries.length - targetCount);
        for (const [key] of toDelete) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('[TTS Cache] Cleanup failed:', error);
    }
  }

  /**
   * 取得快取統計資訊
   */
  async getStats(): Promise<CacheStats> {
    return {
      totalEntries: this.memoryCache.size,
      totalSize: 0, // 需要計算所有 Blob 的大小
      oldestEntry: null,
      newestEntry: null,
    };
  }

  /**
   * 清除所有快取
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.cache.clear();
  }

  /**
   * 清除記憶體快取（保留 IndexedDB）
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * 取得記憶體快取大小
   */
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  /**
   * 清理過期的快取項目
   */
  async cleanupExpired(): Promise<number> {
    // 由於 IndexedDBCache 沒有列出所有鍵的功能
    // 我們只能清理記憶體快取中的過期項目
    // IndexedDB 中的過期項目會在讀取時自動清理
    let cleaned = 0;

    // 清理記憶體快取（簡化實作）
    // 實際應該根據時間戳清理，但由於我們沒有儲存時間戳在記憶體中
    // 這裡只清理超過數量限制的項目
    if (this.memoryCache.size > this.MAX_ENTRIES) {
      const entries = Array.from(this.memoryCache.entries());
      const toDelete = entries.slice(0, entries.length - this.MAX_ENTRIES);
      for (const [key] of toDelete) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// 單例實例
let ttsCacheInstance: TTSAudioCache | null = null;

/**
 * 取得 TTS 快取實例（單例模式）
 */
export function getTTSAudioCache(): TTSAudioCache {
  if (!ttsCacheInstance) {
    ttsCacheInstance = new TTSAudioCache();
  }
  return ttsCacheInstance;
}
