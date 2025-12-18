/**
 * Google Sheet Loader Service
 * Migrated from index.html lines 186-230
 *
 * Loads vocabulary data from Google Sheets using TSV export format
 */

import { parseTSV } from '../utils/tsvParser';
import { GOOGLE_SHEET_CONFIG, SheetConfig } from '../config/googleSheet';

export interface SheetLoadResult {
  rows: Record<string, string>[];
  theme: string;
}

/**
 * Load data from a single Google Sheet
 */
export async function loadFromGoogleSheet(sheetConfig: SheetConfig): Promise<SheetLoadResult> {
  try {
    // 改用 TSV 格式，避免 CSV 的引號和逗號解析問題
    const tsvUrl = `https://docs.google.com/spreadsheets/d/${sheetConfig.sheetId}/export?format=tsv&gid=${sheetConfig.gid}`;
    console.log(`載入 Google Sheet (TSV): ${sheetConfig.name}`, tsvUrl);

    const response = await fetch(tsvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const tsvText = await response.text();
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
