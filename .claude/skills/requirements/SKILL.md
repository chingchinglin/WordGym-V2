# Requirements Clarification Skill

## Purpose
Force requirements clarification BEFORE implementation using the CARIO framework. Prevents wasted effort from unclear, ambiguous, or incomplete requirements.

## Auto-Activation Keywords
- 需求, requirement
- 客戶要, 案主說 (client wants, client says)
- 新功能, 用戶想要 (new feature, user wants)
- 想加一個, 應該要 (want to add, should)

**Priority**: CRITICAL (force_activation: true)

## The CARIO Framework

### C - Context
Why is this needed? What problem does it solve?

### A - Acceptance Criteria
What does "done" look like? How to verify?

### R - Requirements (Explicit)
Exact UI elements, field names, data types, positions.

### I - Interactions
User flows, state changes, component dependencies.

### O - Outputs & Outcomes
Expected results, success/failure states, error messages.

## Workflow

### Step 1: Check Clarity
```bash
# Automated clarity check
./.claude/skills/requirements/scripts/check-clarity.cjs "客戶要求新增篩選功能"
```

### Step 2: Generate Questions
If clarity score < 3/5, generate questions:
```bash
./.claude/skills/requirements/scripts/generate-questions.cjs "客戶要求新增篩選功能"
```

### Step 3: Wait for Answers
**DO NOT implement until user answers.**

### Step 4: Document & Proceed
Once clarified, proceed to implementation.

## Example: Vague vs Clear

### ❌ Vague (score: 1/5)
```
客戶要求新增一個篩選功能
```

### ✅ Clear (score: 5/5)
```
在 VocabularyList 組件右上角新增一個下拉選單，讓使用者可以選擇課本（單選），
選擇後立即篩選顯示該課本的單字。如果選擇「全部」則顯示所有單字。
預設顯示「全部」。
```

## WordGym Students Constraints
When clarifying, remind user of:
- **Single HTML output**: Bundle size matters
- **TypeScript strict**: Need exact types
- **TDD required**: Need testable acceptance criteria
- **Tailwind CSS**: Prefer utility classes

## Token Economy
- Activation: ~100 tokens
- Clarification: ~300 tokens
- **ROI**: Prevents 1-3 failed implementations (saves 5,000-15,000 tokens)

---

**Version**: 2.0-AMP
**Last Updated**: 2025-12-31
