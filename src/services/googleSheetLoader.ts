/**
 * Google Sheet Loader Service
 * Migrated from index.html lines 186-230
 *
 * Loads vocabulary data from Google Sheets using TSV export format
 *
 * CORS/file:// Protocol Solution:
 * ================================
 * Problem: Browsers block fetch() from file:// protocol (security restriction)
 * Google Sheets TSV export has CORS headers (Access-Control-Allow-Origin: *)
 * but this doesn't help with file:// protocol.
 *
 * Solution:
 * - When running from file:// → Use JSONP via CORS proxy (allorigins.win)
 * - When running from http(s):// → Use direct fetch (faster, no proxy)
 *
 * This allows the single-file build (dist/index.html) to work when:
 * 1. Double-clicked (file://) - slower first load, uses proxy
 * 2. Served via HTTP server - normal speed, direct access
 *
 * Alternative approaches considered:
 * - Chrome --allow-file-access-from-files flag (requires user to modify browser)
 * - Embed data in HTML (loses dynamic update capability)
 * - Force HTTP server only (reduces portability)
 */

import { parseTSV } from '../utils/tsvParser';
import { GOOGLE_SHEET_CONFIG, SheetConfig } from '../config/googleSheet';

export interface SheetLoadResult {
  rows: Record<string, string>[];
  theme: string;
}

/**
 * Detect if running from file:// protocol
 */
function isFileProtocol(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}

/**
 * Load data using script tag injection (works from file:// protocol)
 * This uses a CORS proxy that returns JSONP-compatible responses
 */
function loadViaScriptTag(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const callbackName = `gsheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const script = document.createElement('script');
    let timeoutId: number;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    // Set up callback
    (window as any)[callbackName] = (response: any) => {
      cleanup();
      // allorigins.win returns { contents: "data" }
      if (response && response.contents) {
        resolve(response.contents);
      } else {
        reject(new Error('Invalid response from proxy'));
      }
    };

    // Set up error handling
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load script'));
    };

    // Set timeout
    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('Request timeout'));
    }, 30000);

    // Use allorigins.win with callback parameter for JSONP
    const proxyUrl = `https://api.allorigins.win/get?callback=${callbackName}&url=${encodeURIComponent(url)}`;
    script.src = proxyUrl;
    document.head.appendChild(script);
  });
}

/**
 * Load data from a single Google Sheet
 */
export async function loadFromGoogleSheet(sheetConfig: SheetConfig): Promise<SheetLoadResult> {
  try {
    // 改用 TSV 格式，避免 CSV 的引號和逗號解析問題
    const tsvUrl = `https://docs.google.com/spreadsheets/d/${sheetConfig.sheetId}/export?format=tsv&gid=${sheetConfig.gid}`;
    console.log(`載入 Google Sheet (TSV): ${sheetConfig.name}`, tsvUrl);

    let tsvText: string;

    // For file:// protocol, use script tag injection since fetch() doesn't work
    if (isFileProtocol()) {
      console.log('偵測到 file:// 協定，使用 JSONP 方式載入（透過 CORS 代理）');
      tsvText = await loadViaScriptTag(tsvUrl);
    } else {
      // Normal fetch for http:// and https://
      const response = await fetch(tsvUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      tsvText = await response.text();
    }

    console.log(`TSV 原始資料長度: ${tsvText.length} 字符`);

    const rows = parseTSV(tsvText);
    console.log(`解析後得到 ${rows.length} 筆資料`);

    return { rows, theme: sheetConfig.theme };
  } catch (error) {
    console.error(`載入失敗: ${sheetConfig.name}`, error);
    throw error;
  }
}

/**
 * Load data from all configured Google Sheets
 */
export async function loadAllGoogleSheets(): Promise<SheetLoadResult[]> {
  if (!GOOGLE_SHEET_CONFIG.enabled) {
    console.log('Google Sheet 載入已停用');
    return [];
  }

  const results: SheetLoadResult[] = [];
  for (const sheetConfig of GOOGLE_SHEET_CONFIG.sheets) {
    try {
      const result = await loadFromGoogleSheet(sheetConfig);
      results.push(result);
    } catch (error) {
      console.warn(`跳過: ${sheetConfig.name}`);
    }
  }

  return results;
}
