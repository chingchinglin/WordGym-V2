/**
 * Azure TTS Module for jutor.ai Projects
 *
 * 使用方式：
 *   import { speakText, synthesizeToBlob, stopPlayback, VOICES } from './lib/jutor-tts';
 *   await speakText('Hello world');
 *
 * 前置需求：
 *   在 HTML 中引入 Speech SDK：
 *   <script src="https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js"></script>
 *
 * @version 1.0.0
 */

// TypeScript 型別定義
declare global {
  interface Window {
    SpeechSDK: any;
    JutorTTS?: {
      speakText: typeof speakText;
      synthesizeToBlob: typeof synthesizeToBlob;
      playAudioBlob: typeof playAudioBlob;
      stopPlayback: typeof stopPlayback;
      clearAudioCache: typeof clearAudioCache;
      isSDKLoaded: typeof isSDKLoaded;
      isPlaying: typeof isPlaying;
      VOICES: typeof VOICES;
    };
  }
}

// ============================================================================
// 配置
// ============================================================================

import { ttsConfig, shouldUseAzureTTS } from '../config/tts';

/** 後端 API URL（jutor.ai 專案共用） */
const BACKEND_URL = ttsConfig.azureBackendUrl || 'https://speech-token-server-t26idchpnq-de.a.run.app';

/** 預設語音 */
const DEFAULT_VOICE = ttsConfig.defaultVoice || 'en-US-JennyNeural';

/** 預設播放速度 */
const DEFAULT_RATE = ttsConfig.defaultRate || 1.0;

/** Token 快取時間（9 分鐘） */
const TOKEN_LIFETIME_MS = 9 * 60 * 1000;

// ============================================================================
// Token 管理
// ============================================================================

interface TokenState {
  token: string | null;
  region: string | null;
  fetchTime: number;
}

const tokenState: TokenState = {
  token: null,
  region: null,
  fetchTime: 0
};

interface TokenResponse {
  token: string;
  region: string;
}

/**
 * 取得有效的 Azure Speech Token（自動快取）
 * @returns {Promise<{token: string, region: string} | null>}
 */
async function getValidToken(): Promise<TokenResponse | null> {
  // 本地測試模式：跳過 API 呼叫
  if (ttsConfig.localTestMode) {
    console.log('[TTS] Local test mode: Skipping token request');
    return null;
  }

  // 如果配置為不使用 Azure TTS，也跳過
  if (!shouldUseAzureTTS()) {
    return null;
  }

  const now = Date.now();

  // 使用快取的 Token
  if (tokenState.token && tokenState.region && (now - tokenState.fetchTime < TOKEN_LIFETIME_MS)) {
    return { token: tokenState.token, region: tokenState.region };
  }

  // 請求新 Token
  try {
    const response = await fetch(`${BACKEND_URL}/api/get-speech-token`);

    if (response.status === 429) {
      console.warn('[TTS] Rate limited. Please wait 15 minutes.');
      return null;
    }

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json() as TokenResponse;
    tokenState.token = data.token;
    tokenState.region = data.region;
    tokenState.fetchTime = now;

    return { token: data.token, region: data.region };
  } catch (error) {
    console.error('[TTS] Failed to get token:', error);
    return null;
  }
}

/**
 * 建立 SpeechConfig
 * @returns {Promise<any | null>}
 */
async function getSpeechConfig(): Promise<any | null> {
  const tokenData = await getValidToken();
  if (!tokenData) return null;

  try {
    const SpeechSDK = window.SpeechSDK;
    if (!SpeechSDK) {
      console.error('[TTS] SpeechSDK is not loaded');
      return null;
    }
    return SpeechSDK.SpeechConfig.fromAuthorizationToken(
      tokenData.token,
      tokenData.region
    );
  } catch (error) {
    console.error('[TTS] Failed to create SpeechConfig:', error);
    return null;
  }
}

// ============================================================================
// 音訊播放
// ============================================================================

import { getTTSAudioCache } from '../services/TTSAudioCache';

let currentAudio: HTMLAudioElement | null = null;
const audioCache = new Map<string, Blob>(); // 記憶體快取（快速存取）
const ttsCache = getTTSAudioCache(); // IndexedDB 持久化快取
export const TTS_LOADING_EVENT = 'tts-loading';

function emitTtsLoading(isLoading: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TTS_LOADING_EVENT, { detail: { loading: isLoading } })
  );
}

interface PlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error | Event) => void;
}

/**
 * 停止當前播放
 */
function stopPlayback(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * 播放音訊 Blob
 * @param {Blob} blob - 音訊 Blob
 * @param {number} rate - 播放速度 (0.5-2.0)
 * @param {Object} callbacks - 回調函數
 * @returns {HTMLAudioElement}
 */
function playAudioBlob(blob: Blob, rate: number = DEFAULT_RATE, callbacks: PlaybackCallbacks = {}): HTMLAudioElement {
  const { onStart, onEnd, onError } = callbacks;

  stopPlayback();

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  currentAudio = audio;

  audio.onplay = () => onStart?.();
  audio.onended = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    onEnd?.();
  };
  audio.onerror = (e) => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    const normalized =
      e instanceof Error || e instanceof Event ? e : new Error(String(e));
    onError?.(normalized);
  };

  // 將 Promise reject 的錯誤轉換為 Error/DOMException 傳入 onError
  audio.play().catch((err) => {
    const normalized =
      err instanceof Error || err instanceof Event
        ? err
        : new Error(String(err));
    onError?.(normalized);
  });
  return audio;
}

// ============================================================================
// 語音合成 API
// ============================================================================

interface SynthesizeOptions {
  voice?: string;
  useCache?: boolean;
}

/**
 * 合成音訊（不自動播放）
 * @param {string} text - 要合成的文字
 * @param {Object} options - 選項
 * @param {string} options.voice - 語音名稱
 * @param {boolean} options.useCache - 是否使用快取（預設 true）
 * @returns {Promise<Blob | null>}
 */
async function synthesizeToBlob(text: string, options: SynthesizeOptions = {}): Promise<Blob | null> {
  const { voice = DEFAULT_VOICE, useCache = true } = options;
  const cacheKey = `${voice}:${text}`;

  // 1. 先檢查記憶體快取（最快）
  if (useCache && audioCache.has(cacheKey)) {
    console.log('[TTS] Cache hit (memory):', cacheKey.substring(0, 50));
    return audioCache.get(cacheKey)!;
  }

  // 2. 檢查 IndexedDB 持久化快取
  if (useCache) {
    const cachedBlob = await ttsCache.get(voice, text);
    if (cachedBlob) {
      console.log('[TTS] Cache hit (IndexedDB):', cacheKey.substring(0, 50));
      // 同時存入記憶體快取以加速後續存取
      audioCache.set(cacheKey, cachedBlob);
      return cachedBlob;
    }
  }

  // 3. 快取未命中，需要呼叫 API 合成
  console.log('[TTS] Cache miss, synthesizing:', cacheKey.substring(0, 50));
  emitTtsLoading(true);
  const speechConfig = await getSpeechConfig();
  if (!speechConfig) { emitTtsLoading(false); return null; }

  const SpeechSDK = window.SpeechSDK;
  if (!SpeechSDK) {
    console.error('[TTS] SpeechSDK is not loaded');
    emitTtsLoading(false);
    return null;
  }

  speechConfig.speechSynthesisVoiceName = voice;
  const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      async (result: any) => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          const blob = new Blob([result.audioData], { type: 'audio/wav' });
          
          // 存入快取（記憶體 + IndexedDB）
          if (useCache) {
            audioCache.set(cacheKey, blob);
            // 非同步存入 IndexedDB（不阻塞）
            ttsCache.set(voice, text, blob).catch((error) => {
              console.error('[TTS] Failed to cache audio:', error);
            });
          }
          
          emitTtsLoading(false);
          resolve(blob);
        } else {
          emitTtsLoading(false);
          reject(new Error(result.errorDetails || 'Synthesis failed'));
        }
        synthesizer.close();
      },
      (error: any) => {
        synthesizer.close();
        emitTtsLoading(false);
        reject(error);
      }
    );
  });
}

interface SpeakOptions {
  voice?: string;
  rate?: number;
  useCache?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 文字轉語音並播放
 * @param {string} text - 要朗讀的文字
 * @param {Object} options - 選項
 * @param {string} options.voice - 語音名稱（預設 en-US-JennyNeural）
 * @param {number} options.rate - 播放速度 0.5-2.0（預設 1.0）
 * @param {boolean} options.useCache - 是否使用快取（預設 true）
 * @param {Function} options.onStart - 開始播放回調
 * @param {Function} options.onEnd - 播放結束回調
 * @param {Function} options.onError - 錯誤回調
 * @returns {Promise<Blob | null>}
 *
 * @example
 * // 基本使用
 * await speakText('Hello world');
 *
 * // 完整選項
 * await speakText('Welcome!', {
 *   voice: 'en-GB-SoniaNeural',
 *   rate: 0.8,
 *   onStart: () => btn.disabled = true,
 *   onEnd: () => btn.disabled = false,
 *   onError: (e) => console.error(e)
 * });
 */
async function speakText(text: string, options: SpeakOptions = {}): Promise<Blob | null> {
  const {
    voice = DEFAULT_VOICE,
    rate = DEFAULT_RATE,
    useCache = true,
    onStart,
    onEnd,
    onError
  } = options;

  try {
    const blob = await synthesizeToBlob(text, { voice, useCache });
    if (!blob) {
      onError?.(new Error('Synthesis returned null'));
      return null;
    }
    playAudioBlob(blob, rate, { 
      onStart, 
      onEnd, 
      onError: (e) => {
        const error = e instanceof Error ? e : new Error(String(e));
        onError?.(error);
      }
    });
    return blob;
  } catch (error) {
    onError?.(error as Error);
    return null;
  }
}

// ============================================================================
// 工具函數
// ============================================================================

/** 清除音訊快取 */
function clearAudioCache(): void {
  audioCache.clear();
}

/** 取得快取大小 */
function getCacheSize(): number {
  return audioCache.size;
}

/** 檢查 SDK 是否載入 */
function isSDKLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.SpeechSDK !== 'undefined';
}

/** 檢查是否正在播放 */
function isPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

// ============================================================================
// 常用語音常數
// ============================================================================

export const VOICES = {
  // 美式英語
  EN_US_JENNY: 'en-US-JennyNeural',      // 女聲（推薦）
  EN_US_GUY: 'en-US-GuyNeural',          // 男聲
  EN_US_ARIA: 'en-US-AriaNeural',        // 女聲（多風格）

  // 英式英語
  EN_GB_SONIA: 'en-GB-SoniaNeural',      // 女聲
  EN_GB_RYAN: 'en-GB-RyanNeural',        // 男聲

  // 澳洲英語
  EN_AU_NATASHA: 'en-AU-NatashaNeural',  // 女聲

  // 中文（台灣）
  ZH_TW_HSIAO_CHEN: 'zh-TW-HsiaoChenNeural',  // 女聲
  ZH_TW_YUN_JHE: 'zh-TW-YunJheNeural',        // 男聲
} as const;

// ============================================================================
// 匯出
// ============================================================================

export {
  speakText,
  synthesizeToBlob,
  playAudioBlob,
  stopPlayback,
  getValidToken,
  clearAudioCache,
  getCacheSize,
  isSDKLoaded,
  isPlaying,
  BACKEND_URL
};

// 支援非模組環境
if (typeof window !== 'undefined') {
  window.JutorTTS = {
    speakText,
    synthesizeToBlob,
    playAudioBlob,
    stopPlayback,
    clearAudioCache,
    isSDKLoaded,
    isPlaying,
    VOICES
  };
}
