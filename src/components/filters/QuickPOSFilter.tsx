import React from "react";
import { POSType, POS_LABEL } from "../../types";
import { useQuickFilterPos } from "../../hooks/useQuickFilterPos";

// 只顯示 6 個常用的詞性選項
const DISPLAYED_POS: POSType[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrase",
  "other",
];

export const QuickPOSFilter: React.FC = () => {
  const { quickFilterPos, setQuickFilterPos } = useQuickFilterPos();

  const handlePOSFilter = (pos: POSType | "all") => {
    // Removed logging;
    // Removed logging;
    setQuickFilterPos(pos);
    // Removed logging;
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
      <button
        key="all"
        onClick={() => handlePOSFilter("all")}
        className={`u-style text-sm ${quickFilterPos === "all" ? "selected" : ""}`}
        type="button"
      >
        全部
      </button>
      {DISPLAYED_POS.map((pos) => (
        <button
          key={pos}
          onClick={() => handlePOSFilter(pos)}
          className={`u-style text-sm ${quickFilterPos === pos ? "selected" : ""}`}
          type="button"
        >
          {POS_LABEL[pos]}
        </button>
      ))}
    </div>
  );
};
