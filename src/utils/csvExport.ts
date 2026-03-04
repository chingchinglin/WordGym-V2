/**
 * 匯出答錯單字為 CSV 檔案（含 BOM，確保 Excel 正確顯示中文）
 */

interface WrongWordForExport {
  word: string;
  chinese_definition?: string;
  question?: string;
  sentenceTranslation?: string;
  userAnswer?: string;
}

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportWrongWordsToCSV(wrongWords: WrongWordForExport[]): void {
  if (wrongWords.length === 0) return;

  const header = ["英文單字", "中文定義", "題目例句", "例句翻譯", "我的答案"];

  const rows = wrongWords.map((w) => [
    escapeCSVField(w.word || ""),
    escapeCSVField(w.chinese_definition || ""),
    escapeCSVField(w.question || ""),
    escapeCSVField(w.sentenceTranslation || ""),
    escapeCSVField(w.userAnswer || ""),
  ]);

  const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  );

  // BOM for UTF-8 so Excel reads Chinese correctly
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `單字筆記_${today}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
