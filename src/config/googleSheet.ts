/**
 * Google Sheet Configuration
 * Migrated from index.html lines 107-119
 */

export interface GoogleSheetConfig {
  enabled: boolean;
  showImporter: boolean;
  sheets: SheetConfig[];
}

export interface SheetConfig {
  name: string;
  sheetId: string;
  gid: string;
  theme: string;
}

export const GOOGLE_SHEET_CONFIG: GoogleSheetConfig = {
  enabled: true,
  showImporter: false,
  sheets: [
    {
      name: '國中單字彙整',
      sheetId: '1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ',
      gid: '0',
      theme: 'junior_high'
    }
  ]
};

export const PRESET_VERSION = 'google_sheet_v1_new';
