# TTS 音訊快取實作說明

## 📋 概述

為了避免過多的 Azure TTS API 呼叫，我們實作了多層快取機制：

1. **記憶體快取**（Map）- 快速存取，頁面重新載入會清除
2. **IndexedDB 持久化快取** - 跨頁面會話保存，30 天過期

## 🏗️ 架構

### 快取層級

```
使用者請求語音
    ↓
1. 檢查記憶體快取（最快）
    ↓ (未命中)
2. 檢查 IndexedDB 快取（持久化）
    ↓ (未命中)
3. 呼叫 Azure TTS API（最慢）
    ↓
4. 存入兩層快取
```

### 檔案結構

- `src/services/TTSAudioCache.ts` - 快取服務類別
- `src/lib/jutor-tts.ts` - 整合快取到 TTS 功能

## 🔧 功能特性

### 1. 雙層快取機制

**記憶體快取（Map）**
- ✅ 極快存取速度
- ✅ 適合頻繁使用的音訊
- ❌ 頁面重新載入會清除

**IndexedDB 持久化快取**
- ✅ 跨頁面會話保存
- ✅ 30 天自動過期
- ✅ 適合長期使用

### 2. 快取鍵生成

快取鍵格式：`{voice}:{normalized_text}`

- 語音名稱：例如 `en-US-JennyNeural`
- 正規化文字：移除多餘空白、統一大小寫

範例：
- `en-US-JennyNeural:hello world`
- `en-US-GuyNeural:my family goes hiking`

### 3. 快取限制

- **最大項目數**：1000 個
- **最大快取大小**：50MB（規劃中）
- **過期時間**：30 天

### 4. 自動清理機制

- 超過項目數限制時，自動清理最舊的項目
- 讀取時自動檢查並刪除過期項目
- 非同步清理，不阻塞主要功能

## 📊 快取統計

### 可用的統計資訊

```typescript
const stats = await ttsCache.getStats();
// {
//   totalEntries: number,      // 總快取項目數
//   totalSize: number,         // 總快取大小（bytes）
//   oldestEntry: number | null, // 最舊項目時間戳
//   newestEntry: number | null  // 最新項目時間戳
// }
```

### 記憶體快取大小

```typescript
const memorySize = ttsCache.getMemoryCacheSize();
// 返回記憶體快取中的項目數
```

## 🎯 使用方式

### 自動使用

快取已自動整合到 `jutor-tts.ts`，無需額外設定：

```typescript
// 自動使用快取
await speakText('Hello world', {
  voice: 'en-US-JennyNeural',
  useCache: true, // 預設為 true
});
```

### 手動管理快取

```typescript
import { getTTSAudioCache } from '../services/TTSAudioCache';

const cache = getTTSAudioCache();

// 清除所有快取
await cache.clear();

// 清除記憶體快取（保留 IndexedDB）
cache.clearMemoryCache();

// 清理過期項目
const cleaned = await cache.cleanupExpired();
console.log(`清理了 ${cleaned} 個過期項目`);
```

## 🔍 快取命中率監控

在瀏覽器 Console 中可以看到快取狀態：

```
[TTS] Cache hit (memory): en-US-JennyNeural:hello world
[TTS] Cache hit (IndexedDB): en-US-GuyNeural:my family
[TTS] Cache miss, synthesizing: en-US-JennyNeural:new text
```

## 📈 效能優化

### 快取命中時的效能

- **記憶體快取命中**：< 1ms（幾乎即時）
- **IndexedDB 快取命中**：10-50ms（取決於硬碟速度）
- **API 呼叫**：200-500ms（網路延遲 + 語音合成）

### 預期效果

- **首次播放**：需要 API 呼叫（200-500ms）
- **後續播放**：使用快取（< 50ms）
- **跨頁面會話**：使用 IndexedDB 快取（10-50ms）

## 🛠️ 技術細節

### IndexedDB 結構

**資料庫名稱**：`wordgym-tts-audio`
**Store 名稱**：`audio-store`

**儲存格式**：
```typescript
interface CachedAudio {
  blob: Blob;           // 音訊 Blob
  timestamp: number;    // 建立時間戳
  voice: string;        // 語音名稱
  text: string;         // 原始文字
}
```

### 快取鍵正規化

```typescript
// 原始文字
"Hello   World"

// 正規化後
"hello world"

// 快取鍵
"en-US-JennyNeural:hello world"
```

## ⚙️ 配置選項

在 `TTSAudioCache.ts` 中可以調整：

```typescript
private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
private readonly MAX_ENTRIES = 1000;                 // 最多 1000 個項目
private readonly CACHE_EXPIRY_DAYS = 30;            // 30 天過期
```

## 🐛 除錯

### 檢查快取狀態

```typescript
import { getTTSAudioCache } from '../services/TTSAudioCache';

const cache = getTTSAudioCache();
console.log('記憶體快取大小:', cache.getMemoryCacheSize());
console.log('快取統計:', await cache.getStats());
```

### 清除快取

如果遇到問題，可以清除快取：

```typescript
// 清除所有快取
await cache.clear();
```

## 📝 注意事項

1. **IndexedDB 限制**：瀏覽器對 IndexedDB 有儲存空間限制（通常數 GB）
2. **Blob 大小**：每個音訊 Blob 約 10-50KB，1000 個項目約 10-50MB
3. **非同步操作**：IndexedDB 操作是非同步的，不會阻塞 UI
4. **錯誤處理**：快取失敗時會自動降級到 API 呼叫

## 🚀 未來改進

- [ ] 實作快取大小計算（目前只有項目數限制）
- [ ] 添加快取命中率統計
- [ ] 實作 LRU（最近最少使用）清理策略
- [ ] 添加快取預載入功能
- [ ] 支援快取壓縮以節省空間
