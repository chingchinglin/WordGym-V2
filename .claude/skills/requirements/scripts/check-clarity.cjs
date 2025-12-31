#!/usr/bin/env node
/**
 * Check requirement clarity using CARIO framework
 * Returns JSON score and recommendations
 * Usage: echo "requirement text" | ./check-clarity.js
 *        OR ./check-clarity.js "requirement text"
 */

const fs = require('fs');

// Get input from stdin or args
let requirement = '';

if (process.argv.length > 2) {
  // From command line args
  requirement = process.argv.slice(2).join(' ');
} else {
  // From stdin
  requirement = fs.readFileSync(0, 'utf-8');
}

// CARIO framework checks
const checks = {
  hasContext: /為什麼|why|problem|背景|需要|解決/i.test(requirement),
  hasAcceptance: /驗收|成功|完成|算是|acceptance|done|verify/i.test(requirement),
  hasRequirements: /按鈕|欄位|位置|下拉|單選|多選|button|field|dropdown|具體/i.test(requirement),
  hasInteractions: /使用者|點擊|選擇|立即|user|click|select|flow|when|after/i.test(requirement),
  hasOutputs: /顯示|結果|訊息|show|display|output|message|預設|default/i.test(requirement)
};

const score = Object.values(checks).filter(Boolean).length;
const clarity = score >= 3 ? 'CLEAR' : 'UNCLEAR';

const result = {
  clarity,
  score: `${score}/5`,
  checks,
  recommendation: clarity === 'CLEAR'
    ? '✅ Proceed with implementation'
    : '⚠️ Apply CARIO framework - ask clarification questions'
};

console.log(JSON.stringify(result, null, 2));
process.exit(clarity === 'CLEAR' ? 0 : 1);
