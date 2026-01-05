import React, { useState, useRef } from "react";
import { Button } from "../ui";
import { parseCSV } from "../../utils/csvParser";
import { POS_LABEL } from "../../types";
import type { POSType } from "../../types";

export interface ImportStats {
  added: number;
  merged: number;
  tagsAdded?: Record<string, number>;
}

export interface ImportOptions {
  overrideExamples: boolean;
  replace: boolean;
}

export interface ImporterProps {
  onImport: (data: any[], options: ImportOptions) => ImportStats;
  className?: string;
}

export const Importer: React.FC<ImporterProps> = ({
  onImport,
  className = "",
}) => {
  const [msg, setMsg] = useState("");
  const [paste, setPaste] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [override, setOverride] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const posSummary = (stats: ImportStats): string =>
    Object.entries(stats.tagsAdded || {})
      .map(([k, v]) => `${POS_LABEL[k as POSType] || k}:${v}`)
      .join("、");

  const importText = async (
    rawText: string | ArrayBuffer | null,
    hint: string,
  ) => {
    const text = String(rawText || "")
      .replace(/^\uFEFF/, "")
      .trim();
    if (!text) {
      setMsg("匯入失敗：內容為空");
      return;
    }

    const tryJson = (): boolean => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const stats = onImport(parsed, {
            overrideExamples: override,
            replace: false,
          });
          const summary = posSummary(stats);
          setMsg(
            `已匯入 ${stats.added + stats.merged} 筆（${hint}JSON），新增單字 ${stats.added}，合併 ${stats.merged}${
              summary ? `，新增標籤 ${summary}` : ""
            }。`,
          );
          return true;
        }
      } catch { /* JSON parse failed, try CSV */ }
      return false;
    };

    if (tryJson()) return;
    const rows = parseCSV(text);
    if (!rows.length) {
      setMsg("匯入失敗：內容不是有效的 JSON 或 CSV");
      return;
    }
    const stats = onImport(rows, {
      overrideExamples: override,
      replace: false,
    });
    const summary = posSummary(stats);
    setMsg(
      `已匯入 ${stats.added + stats.merged} 筆（${hint}CSV），新增單字 ${stats.added}，合併 ${stats.merged}${
        summary ? `，新增標籤 ${summary}` : ""
      }。`,
    );
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importText(reader.result, `${file.name}/`);
    };
    reader.onerror = () => {
      setMsg(`匯入失敗：無法讀取檔案 ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importText(reader.result, `${file.name}/`);
    };
    reader.onerror = () => {
      setMsg(`匯入失敗：無法讀取檔案 ${file.name}`);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={`rounded-2xl border p-4 bg-white/60 ${
        dragOver ? "ring-2 ring-indigo-400" : ""
      } ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="font-semibold mb-2">資料匯入（JSON/CSV）</div>
      <p className="text-sm text-gray-600 mb-3">
        三種方式：① 選擇檔案 ② 拖曳到此區 ③ 直接貼上文字
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json,.csv,text/csv,text/plain"
          className="hidden"
          onChange={onInputChange}
        />
        <Button variant="ghost" onClick={() => inputRef.current?.click()}>
          選擇 JSON 或 CSV 檔
        </Button>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            className="mr-1"
            checked={override}
            onChange={(e) => setOverride(e.target.checked)}
          />
          匯入例句／翻譯時覆蓋現有內容
        </label>
        <span className="text-xs text-gray-500">或拖曳檔案至此</span>
      </div>

      <div className="mt-2">
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="或直接貼上 JSON / CSV 文字..."
          className="w-full h-28 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="mt-2">
          <Button variant="ghost" onClick={() => importText(paste, "貼上/")}>
            匯入貼上的內容
          </Button>
        </div>
      </div>

      {msg && <div className="text-xs text-gray-500 mt-2">{msg}</div>}
    </div>
  );
};
