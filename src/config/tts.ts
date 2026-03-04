/**
 * TTS 配置檔案
 * 用於切換不同的文字轉語音來源
 */

export type TTSProvider = 'azure' | 'browser' | 'local';
export type VoiceRotationMode = 'sequential' | 'random' | 'fixed';

export interface TTSConfig {
  /** TTS 提供者 */
  provider: TTSProvider;
  
  /** 是否啟用本地測試模式（不使用後端 API） */
  localTestMode: boolean;
  
  /** Azure TTS 後端 URL（僅在非本地測試模式時使用） */
  azureBackendUrl?: string;
  
  /** 預設語音（Azure TTS 使用） */
  defaultVoice?: string;
  
  /** 預設播放速度 */
  defaultRate?: number;
  
  /** 是否自動切換 Azure 語音 */
  autoRotateVoices?: boolean;
  
  /** 語音切換模式：'sequential'（順序輪換）、'random'（隨機）、'fixed'（固定） */
  voiceRotationMode?: VoiceRotationMode;
  
  /** 可用的 Azure 語音列表（用於自動切換） */
  availableVoices?: string[];
}

/**
 * 預設配置
 * 自動使用 Azure TTS 並自動切換不同語音
 */
export const ttsConfig: TTSConfig = {
  // 自動使用 Azure TTS
  provider: 'azure',
  
  // 本地測試模式：設為 false 以使用後端 API 取得 Azure Token
  localTestMode: false,
  
  // Azure TTS 後端 URL
  azureBackendUrl: 'https://speech-token-server-t26idchpnq-de.a.run.app',
  
  // 預設語音（當 autoRotateVoices 為 false 時使用）
  defaultVoice: 'en-US-JennyNeural',
  
  // 預設播放速度
  defaultRate: 0.9,
  
  // 自動切換 Azure 語音（已改為根據內容類型選擇，此設定僅用於 'other' 類型）
  autoRotateVoices: false,
  
  // 語音切換模式：'sequential'（順序輪換）、'random'（隨機）、'fixed'（固定）
  voiceRotationMode: 'fixed',
  
  // 可用的 Azure 語音列表（用於自動切換，目前不使用）
  availableVoices: [
    'en-US-JennyNeural',      // 美式英語女聲（單字和例句一使用）
    'en-US-GuyNeural',        // 美式英語男聲（例句二使用）
  ],
};

/**
 * 檢查是否應該使用 Azure TTS
 */
export function shouldUseAzureTTS(): boolean {
  return ttsConfig.provider === 'azure' || 
         (ttsConfig.provider === 'local' && !ttsConfig.localTestMode);
}

/**
 * 檢查是否應該使用瀏覽器 API
 */
export function shouldUseBrowserAPI(): boolean {
  return ttsConfig.provider === 'browser' || 
         (ttsConfig.provider === 'local' && ttsConfig.localTestMode);
}

/**
 * 取得下一個要使用的語音（自動切換）
 */
let voiceIndex = 0;

export function getNextVoice(): string {
  if (!ttsConfig.autoRotateVoices || !ttsConfig.availableVoices || ttsConfig.availableVoices.length === 0) {
    return ttsConfig.defaultVoice || 'en-US-JennyNeural';
  }

  const voices = ttsConfig.availableVoices;
  
  if (ttsConfig.voiceRotationMode === 'random') {
    // 隨機選擇
    return voices[Math.floor(Math.random() * voices.length)];
  } else if (ttsConfig.voiceRotationMode === 'sequential') {
    // 順序輪換
    const voice = voices[voiceIndex % voices.length];
    voiceIndex++;
    return voice;
  } else {
    // 固定使用預設語音
    return ttsConfig.defaultVoice || voices[0];
  }
}

/**
 * 重置語音索引（用於順序輪換）
 */
export function resetVoiceIndex(): void {
  voiceIndex = 0;
}

/**
 * 語音類型
 */
export type VoiceType = 'word' | 'example1' | 'example2' | 'other';

/**
 * 根據內容類型取得對應的語音
 * - 單字發音：美式女聲
 * - 例句一：美式女聲
 * - 例句二：美式男聲
 * - 其他：使用自動切換
 */
export function getVoiceByType(type: VoiceType = 'other'): string {
  switch (type) {
    case 'word':
      // 單字發音：美式女聲
      return 'en-US-JennyNeural';
    case 'example1':
      // 例句一：美式女聲
      return 'en-US-JennyNeural';
    case 'example2':
      // 例句二：美式男聲
      return 'en-US-GuyNeural';
    case 'other':
    default:
      // 其他：使用自動切換（如果啟用）
      return getNextVoice();
  }
}
