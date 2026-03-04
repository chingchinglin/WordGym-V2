export interface LabelInfo {
  version: string; // "翰林"
  stage: string; // "junior"
  vol: string; // "B1"
  lesson: string; // "U1"
}

const LABEL_VERSION_MAP: Record<string, { version: string; stage: string }> = {
  KH: { version: "康軒", stage: "junior" },
  HL: { version: "翰林", stage: "junior" },
  NI: { version: "南一", stage: "junior" },
  LT: { version: "龍騰", stage: "senior" },
  SM: { version: "三民", stage: "senior" },
};

export function parseLabel(label: string): LabelInfo | null {
  const parts = label.split("_");
  if (parts.length !== 3) return null;
  const [code, vol, lesson] = parts;
  const mapping = LABEL_VERSION_MAP[code.toUpperCase()];
  if (!mapping) return null;
  return { ...mapping, vol, lesson };
}
