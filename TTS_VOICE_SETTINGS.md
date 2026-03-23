# TTS 語音設定說明

## 📊 目前設定的語音

目前有 **6 個語音**在自動切換列表中：

1. `en-US-JennyNeural` - 美式英語女聲
2. `en-US-GuyNeural` - 美式英語男聲
3. `en-US-AriaNeural` - 美式英語女聲（多風格）
4. `en-GB-SoniaNeural` - 英式英語女聲
5. `en-GB-RyanNeural` - 英式英語男聲
6. `en-AU-NatashaNeural` - 澳洲英語女聲

## 🔧 如何設定語音

### 1. 修改語音列表

編輯 `src/config/tts.ts` 檔案中的 `availableVoices` 陣列：

```typescript
availableVoices: [
  'en-US-JennyNeural',      // 美式英語女聲
  'en-US-GuyNeural',        // 美式英語男聲
  'en-US-AriaNeural',       // 美式英語女聲（多風格）
  'en-GB-SoniaNeural',      // 英式英語女聲
  'en-GB-RyanNeural',       // 英式英語男聲
  'en-AU-NatashaNeural',    // 澳洲英語女聲
  // 可以在這裡添加更多語音
],
```

### 2. 添加更多語音

您可以在 `availableVoices` 陣列中添加更多 Azure TTS 語音。可用的語音包括：

**美式英語：**
- `en-US-JennyNeural` - 女聲（推薦）
- `en-US-GuyNeural` - 男聲
- `en-US-AriaNeural` - 女聲（多風格）
- `en-US-DavisNeural` - 男聲
- `en-US-JaneNeural` - 女聲
- `en-US-JasonNeural` - 男聲
- `en-US-NancyNeural` - 女聲
- `en-US-SaraNeural` - 女聲
- `en-US-TonyNeural` - 男聲

**英式英語：**
- `en-GB-SoniaNeural` - 女聲
- `en-GB-RyanNeural` - 男聲
- `en-GB-LibbyNeural` - 女聲
- `en-GB-MaisieNeural` - 女聲（年輕）
- `en-GB-ThomasNeural` - 男聲

**澳洲英語：**
- `en-AU-NatashaNeural` - 女聲
- `en-AU-WilliamNeural` - 男聲

**中文（台灣）：**
- `zh-TW-HsiaoChenNeural` - 女聲
- `zh-TW-YunJheNeural` - 男聲

**範例：添加中文語音**

```typescript
availableVoices: [
  'en-US-JennyNeural',
  'en-US-GuyNeural',
  'zh-TW-HsiaoChenNeural',  // 新增：中文女聲
  'zh-TW-YunJheNeural',      // 新增：中文男聲
],
```

### 3. 移除語音

從 `availableVoices` 陣列中刪除不需要的語音：

```typescript
availableVoices: [
  'en-US-JennyNeural',      // 保留
  'en-US-GuyNeural',        // 保留
  // 'en-US-AriaNeural',    // 移除：註解掉或刪除這行
  'en-GB-SoniaNeural',      // 保留
],
```

### 4. 改變語音順序

調整陣列中的順序即可改變輪換順序：

```typescript
availableVoices: [
  'en-GB-SoniaNeural',      // 現在會第一個播放
  'en-US-JennyNeural',      // 第二個
  'en-US-GuyNeural',        // 第三個
],
```

### 5. 改變切換模式

修改 `voiceRotationMode` 設定：

```typescript
// 順序輪換（預設）：依序使用每個語音
voiceRotationMode: 'sequential',

// 隨機選擇：每次隨機選擇一個語音
voiceRotationMode: 'random',

// 固定：始終使用同一個語音（defaultVoice）
voiceRotationMode: 'fixed',
```

### 6. 關閉自動切換

如果您想固定使用一個語音，可以：

**方法 1：關閉自動切換**
```typescript
autoRotateVoices: false,
defaultVoice: 'en-US-JennyNeural',  // 固定使用這個語音
```

**方法 2：使用固定模式**
```typescript
autoRotateVoices: true,
voiceRotationMode: 'fixed',
defaultVoice: 'en-US-JennyNeural',
```

## 📝 完整設定範例

### 範例 1：只使用美式英語（3 個語音）

```typescript
availableVoices: [
  'en-US-JennyNeural',
  'en-US-GuyNeural',
  'en-US-AriaNeural',
],
voiceRotationMode: 'sequential',
```

### 範例 2：混合不同口音（8 個語音）

```typescript
availableVoices: [
  'en-US-JennyNeural',      // 美式英語女聲
  'en-US-GuyNeural',        // 美式英語男聲
  'en-GB-SoniaNeural',      // 英式英語女聲
  'en-GB-RyanNeural',       // 英式英語男聲
  'en-AU-NatashaNeural',    // 澳洲英語女聲
  'zh-TW-HsiaoChenNeural',  // 中文女聲
  'zh-TW-YunJheNeural',     // 中文男聲
],
voiceRotationMode: 'random',  // 隨機選擇
```

### 範例 3：固定使用一個語音

```typescript
autoRotateVoices: false,
defaultVoice: 'en-US-JennyNeural',
```

## 🎯 運作方式

### 順序輪換模式（sequential）

每次播放時會依序切換：
- 第 1 次播放 → `en-US-JennyNeural`
- 第 2 次播放 → `en-US-GuyNeural`
- 第 3 次播放 → `en-US-AriaNeural`
- ...
- 第 7 次播放 → `en-US-JennyNeural`（循環）

### 隨機模式（random）

每次播放時隨機選擇一個語音：
- 第 1 次播放 → 可能是 `en-US-GuyNeural`
- 第 2 次播放 → 可能是 `en-US-JennyNeural`
- 第 3 次播放 → 可能是 `en-GB-SoniaNeural`
- ...

### 固定模式（fixed）

始終使用同一個語音：
- 所有播放 → `defaultVoice`（例如 `en-US-JennyNeural`）

## 🔍 查看目前使用的語音

打開瀏覽器的開發者工具（F12），查看 Console 輸出：

```
[TTS] Using Azure TTS with voice: en-US-JennyNeural
[TTS] Using Azure TTS with voice: en-US-GuyNeural
[TTS] Using Azure TTS with voice: en-US-AriaNeural
```

## 📚 更多 Azure TTS 語音

Azure TTS 支援超過 400 種語音，涵蓋多種語言和地區。您可以查看 [Azure TTS 語音列表](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts) 來選擇更多語音。

語音名稱格式：`{語言代碼}-{地區代碼}-{語音名稱}Neural`

例如：
- `en-US-JennyNeural` = 英語（美國）- Jenny（神經語音）
- `zh-TW-HsiaoChenNeural` = 中文（台灣）- 曉臻（神經語音）
