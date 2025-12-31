#!/usr/bin/env node
/**
 * Generate CARIO clarification questions for unclear requirements
 * Usage: ./generate-questions.js "requirement text"
 */

const requirement = process.argv.slice(2).join(' ');

if (!requirement) {
  console.error('❌ Usage: ./generate-questions.js "requirement text"');
  process.exit(1);
}

// Parse requirement to identify missing CARIO elements
const checks = {
  hasContext: /為什麼|why|problem|背景/i.test(requirement),
  hasAcceptance: /驗收|成功|acceptance/i.test(requirement),
  hasRequirements: /按鈕|欄位|位置|button|field|具體/i.test(requirement),
  hasInteractions: /使用者|點擊|user|click|flow/i.test(requirement),
  hasOutputs: /顯示|結果|show|display|output/i.test(requirement)
};

console.log('## 需求釐清問題 (Requirement Clarification)\n');

if (!checks.hasContext) {
  console.log('### Context (背景)');
  console.log('- 為什麼需要這個功能？');
  console.log('- 目前的流程有什麼問題？');
  console.log('- 哪些用戶會使用？\n');
}

if (!checks.hasAcceptance) {
  console.log('### Acceptance Criteria (驗收標準)');
  console.log('- 什麼情況下算是完成？');
  console.log('- 如何驗證功能正確？');
  console.log('- 邊界情況要怎麼處理？\n');
}

if (!checks.hasRequirements) {
  console.log('### Requirements (具體需求)');
  console.log('- 具體要在哪裡新增？');
  console.log('- 欄位名稱和資料格式是什麼？');
  console.log('- 是單選還是多選？\n');
}

if (!checks.hasInteractions) {
  console.log('### Interactions (互動流程)');
  console.log('- 使用者操作後會發生什麼？');
  console.log('- 立即生效還是需要確認？');
  console.log('- 如何重置或清除？\n');
}

if (!checks.hasOutputs) {
  console.log('### Outputs (預期結果)');
  console.log('- 成功時要顯示什麼？');
  console.log('- 失敗或無結果時要怎麼處理？');
  console.log('- 預設狀態是什麼？\n');
}

console.log('⏸️ **WAIT for user answers before implementation**');
