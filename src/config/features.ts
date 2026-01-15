/**
 * Feature Flags - 功能開關配置
 * 
 * 用於控制哪些功能目前開放使用
 * 未來開放功能時，只需將對應的 flag 設為 true
 */
export const FEATURES = {
  textbook: true,   // 課本進度 - 正常運作
  exam: false,      // 大考衝刺 - Coming Soon
  theme: false,     // 主題探索 - Coming Soon
} as const;

/**
 * 檢查指定功能是否啟用
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
