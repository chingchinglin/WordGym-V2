/**
 * Speech synthesis utility functions
 * 
 * 根據配置選擇 TTS 來源：
 * - Azure TTS（更好的語音品質，需要後端 API）
 * - 瀏覽器內建的 SpeechSynthesis API（完全本地）
 * - 本地測試模式（優先使用瀏覽器 API）
 */

import { speakText, stopPlayback, isSDKLoaded, isPlaying as isAzurePlaying } from "../lib/jutor-tts";
import { ttsConfig, shouldUseAzureTTS, shouldUseBrowserAPI, getVoiceByType, VoiceType } from "../config/tts";

// 追蹤瀏覽器 SpeechSynthesis API 的播放狀態
let browserSpeaking = false;

/**
 * 使用瀏覽器內建的 SpeechSynthesis API（Fallback）
 */
function speakWithBrowserAPI(text: string): void {
  if (!("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();
    browserSpeaking = false;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // 追蹤播放狀態
    utterance.onstart = () => {
      browserSpeaking = true;
    };
    
    utterance.onend = () => {
      browserSpeaking = false;
    };
    
    utterance.onerror = () => {
      browserSpeaking = false;
    };
    
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Speech synthesis error:", error);
    browserSpeaking = false;
  }
}

/**
 * 語音播放函數
 * 根據配置選擇 TTS 來源，並根據內容類型選擇對應的語音
 * 
 * @param rawText - 要播放的文字
 * @param voiceType - 語音類型：'word'（單字）、'example1'（例句一）、'example2'（例句二）、'other'（其他）
 */
export const speak = (rawText: string, voiceType: VoiceType = 'other'): void => {
  const text = String(rawText || "").trim();
  if (!text) return;

  // 根據配置決定使用哪個 TTS 來源
  if (shouldUseBrowserAPI()) {
    // 使用瀏覽器 API（完全本地，不需要網路）
    console.log('[TTS] Using browser SpeechSynthesis API');
    speakWithBrowserAPI(text);
  } else if (shouldUseAzureTTS() && isSDKLoaded()) {
    // 根據內容類型選擇對應的語音
    const voice = getVoiceByType(voiceType);
    console.log(`[TTS] Using Azure TTS with voice: ${voice} (type: ${voiceType})`);
    speakText(text, {
      voice: voice, // 根據類型選擇的語音
      rate: ttsConfig.defaultRate || 0.9,
      useCache: true,
      onError: (error) => {
        // Azure TTS 失敗，降級到瀏覽器 API
        console.warn("[TTS] Azure TTS failed, falling back to browser API:", error);
        speakWithBrowserAPI(text);
      }
    }).catch((error) => {
      // 如果 speakText 本身拋出錯誤，也降級到瀏覽器 API
      console.warn("[TTS] Azure TTS error, falling back to browser API:", error);
      speakWithBrowserAPI(text);
    });
  } else {
    // SDK 未載入或配置不支援 Azure，直接使用瀏覽器 API
    console.log('[TTS] Azure TTS not available, using browser API');
    speakWithBrowserAPI(text);
  }
};

/**
 * 停止語音播放
 * 同時停止 Azure TTS 和瀏覽器 API 的播放
 */
export const stopSpeech = (): void => {
  // 停止 Azure TTS 播放
  stopPlayback();
  
  // 停止瀏覽器 API 播放
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  
  // 重置狀態
  browserSpeaking = false;
};

/**
 * 檢查是否正在播放語音
 * 同時檢查 Azure TTS 和瀏覽器 API 的播放狀態
 * @returns {boolean} 如果正在播放則返回 true
 */
export const isSpeaking = (): boolean => {
  // 檢查 Azure TTS 是否正在播放
  if (shouldUseAzureTTS() && isSDKLoaded() && isAzurePlaying()) {
    return true;
  }
  
  // 檢查瀏覽器 API 是否正在播放
  if (shouldUseBrowserAPI() || !shouldUseAzureTTS() || !isSDKLoaded()) {
    // 檢查瀏覽器 SpeechSynthesis 狀態
    if ("speechSynthesis" in window) {
      // 使用我們追蹤的狀態，或檢查 speechSynthesis.speaking
      return browserSpeaking || window.speechSynthesis.speaking;
    }
  }
  
  return false;
};
