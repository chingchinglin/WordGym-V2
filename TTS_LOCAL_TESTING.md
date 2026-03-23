# TTS 本地測試指南

本文件說明如何在本機端測試不同的文字轉語音（TTS）來源。

## 📋 配置說明

TTS 來源的配置位於 `src/config/tts.ts`，您可以修改此檔案來切換不同的 TTS 提供者。

### 可用的 TTS 提供者

1. **`'browser'`** - 使用瀏覽器內建的 SpeechSynthesis API
   - ✅ 完全本地，不需要網路連線
   - ✅ 不需要任何後端 API
   - ❌ 語音品質較差（機械音）
   - ✅ 適合完全離線測試

2. **`'azure'`** - 使用 Azure TTS
   - ✅ 語音品質優秀（自然語音）
   - ⚠️ 需要後端 API 取得 Token
   - ⚠️ 需要網路連線
   - ✅ 適合生產環境

3. **`'local'`** - 本地測試模式
   - 優先使用瀏覽器 API（如果 `localTestMode: true`）
   - 如果瀏覽器 API 不可用，會嘗試 Azure TTS
   - ✅ 適合開發和測試

## 🔧 如何切換 TTS 來源

### 方法 1：修改配置檔案

編輯 `src/config/tts.ts`：

```typescript
export const ttsConfig: TTSConfig = {
  // 選擇 'browser' 使用瀏覽器 API（完全本地）
  provider: 'browser',
  
  // 本地測試模式
  localTestMode: true,
  
  // 其他配置...
};
```

### 配置選項說明

| 選項 | 類型 | 說明 |
|------|------|------|
| `provider` | `'azure' \| 'browser' \| 'local'` | TTS 提供者 |
| `localTestMode` | `boolean` | 是否啟用本地測試模式（跳過後端 API） |
| `azureBackendUrl` | `string?` | Azure TTS 後端 URL |
| `defaultVoice` | `string?` | 預設語音（Azure TTS） |
| `defaultRate` | `number?` | 預設播放速度 |

## 🧪 測試步驟

### 1. 使用瀏覽器 API（完全本地）

```typescript
// src/config/tts.ts
export const ttsConfig: TTSConfig = {
  provider: 'browser',
  localTestMode: true,
};
```

**優點：**
- 不需要網路連線
- 不需要後端 API
- 立即可用

**測試：**
1. 修改配置為 `provider: 'browser'`
2. 啟動開發伺服器：`npm run dev`
3. 點擊任何單字的發音按鈕
4. 應該會聽到瀏覽器的語音（可能品質較差）

### 2. 使用 Azure TTS（需要後端）

```typescript
// src/config/tts.ts
export const ttsConfig: TTSConfig = {
  provider: 'azure',
  localTestMode: false, // 需要後端 API
  azureBackendUrl: 'https://speech-token-server-t26idchpnq-de.a.run.app',
};
```

**優點：**
- 語音品質優秀
- 自然語音

**測試：**
1. 修改配置為 `provider: 'azure'` 和 `localTestMode: false`
2. 確保網路連線正常
3. 啟動開發伺服器：`npm run dev`
4. 點擊任何單字的發音按鈕
5. 應該會聽到 Azure TTS 的高品質語音

### 3. 本地測試模式（混合）

```typescript
// src/config/tts.ts
export const ttsConfig: TTSConfig = {
  provider: 'local',
  localTestMode: true, // 優先使用瀏覽器 API
};
```

**優點：**
- 優先使用本地 API
- 如果失敗會自動降級

## 📝 預設配置

目前的預設配置為：

```typescript
export const ttsConfig: TTSConfig = {
  provider: 'local',        // 本地測試模式
  localTestMode: true,      // 不使用後端 API
  defaultVoice: 'en-US-JennyNeural',
  defaultRate: 0.9,
};
```

這意味著：
- ✅ 會優先使用瀏覽器 API（完全本地）
- ✅ 不需要網路連線
- ✅ 適合本地開發和測試

## 🔍 除錯

### 檢查目前使用的 TTS 來源

打開瀏覽器的開發者工具（F12），查看 Console 輸出：

- `[TTS] Using browser SpeechSynthesis API` - 使用瀏覽器 API
- `[TTS] Using Azure TTS` - 使用 Azure TTS
- `[TTS] Local test mode: Skipping token request` - 本地測試模式

### 常見問題

**Q: 為什麼聽不到聲音？**
- 檢查瀏覽器是否支援 SpeechSynthesis API
- 檢查瀏覽器的音量設定
- 查看 Console 是否有錯誤訊息

**Q: 如何確認使用的是哪個 TTS？**
- 查看 Console 的日誌訊息
- 比較語音品質（Azure TTS 明顯更自然）

**Q: 可以同時支援多個 TTS 來源嗎？**
- 可以，使用 `provider: 'local'` 模式會自動降級

## 🚀 下一步

1. 根據您的需求修改 `src/config/tts.ts`
2. 啟動開發伺服器：`npm run dev`
3. 測試不同的 TTS 來源
4. 選擇最適合您需求的配置
