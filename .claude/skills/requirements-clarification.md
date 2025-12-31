# Requirements Clarification Skill

## Purpose
Force requirements clarification BEFORE implementation using the CARIO framework. Prevents wasted effort from implementing features based on unclear, ambiguous, or incomplete requirements.

## Auto-Activation Keywords
This skill auto-activates when user messages contain:
- 需求, requirement
- 客戶要, 案主說 (client wants, client says)
- 新功能, 用戶想要 (new feature, user wants)
- 想加一個, 應該要 (want to add, should)
- 客戶反饋, 需要改成 (client feedback, need to change to)

**Priority**: CRITICAL (force_activation: true)

## The CARIO Framework

CARIO is a structured requirements clarification framework:

### C - Context
**What to clarify:**
- Why is this feature needed?
- What problem does it solve?
- Who are the users?
- What's the current behavior?

**Example questions:**
- "為什麼需要這個功能？" (Why is this feature needed?)
- "目前的流程有什麼問題？" (What's wrong with current workflow?)
- "哪些用戶會使用這個功能？" (Which users will use this?)

### A - Acceptance Criteria
**What to clarify:**
- What does "done" look like?
- How do we verify it works?
- What are the edge cases?
- What should NOT happen?

**Example questions:**
- "什麼情況下算是完成？" (When is it considered done?)
- "如何驗證功能正確？" (How to verify it's correct?)
- "邊界情況要怎麼處理？" (How to handle edge cases?)

### R - Requirements (Explicit)
**What to clarify:**
- Exact UI elements and their positions
- Specific field names and data types
- Exact behavior and interactions
- Technical constraints

**Example questions:**
- "按鈕要放在哪裡？" (Where should the button be placed?)
- "欄位名稱是什麼？" (What's the field name?)
- "資料格式是什麼？" (What's the data format?)

### I - Interactions
**What to clarify:**
- User interaction flows
- System state changes
- Component dependencies
- Side effects

**Example questions:**
- "使用者點擊後會發生什麼？" (What happens when user clicks?)
- "這會影響其他組件嗎？" (Will this affect other components?)
- "狀態要如何更新？" (How should state be updated?)

### O - Outputs & Outcomes
**What to clarify:**
- Expected results and outputs
- Success/failure states
- Error messages
- Performance requirements

**Example questions:**
- "成功時要顯示什麼？" (What to show on success?)
- "失敗時要怎麼處理？" (How to handle failure?)
- "效能要求是什麼？" (What are the performance requirements?)

## Workflow

### Step 1: Detect Requirement Request
When user mentions new feature or change request, activate this skill.

### Step 2: Analyze Clarity Level
Classify requirement as:
- **CLEAR**: All CARIO elements specified → Proceed to implementation
- **PARTIALLY CLEAR**: Some elements missing → Ask clarification questions
- **UNCLEAR**: Most elements missing → Full CARIO analysis required

### Step 3: Generate Clarification Questions
Based on missing CARIO elements, generate specific questions:

**Format:**
```markdown
## 需求釐清問題 (Requirement Clarification Questions)

### Context (背景)
- [Question 1]
- [Question 2]

### Acceptance Criteria (驗收標準)
- [Question 3]
- [Question 4]

### Requirements (具體需求)
- [Question 5]
- [Question 6]

### Interactions (互動流程)
- [Question 7]
- [Question 8]

### Outputs (預期結果)
- [Question 9]
- [Question 10]
```

### Step 4: Wait for User Response
**DO NOT implement until user answers questions.**

### Step 5: Document Clarified Requirements
Once user answers, document requirements in structured format for implementation.

## Example Usage

### Example 1: Vague Request

**User Input:**
```
客戶要求新增一個篩選功能
```

**CARIO Analysis:**
- Context: ❌ Missing (why needed?)
- Acceptance: ❌ Missing (what's success?)
- Requirements: ❌ Missing (filter what? where?)
- Interactions: ❌ Missing (how to use?)
- Outputs: ❌ Missing (what to display?)

**Clarification Questions:**
```markdown
## 需求釐清問題

### Context (背景)
- 為什麼需要篩選功能？目前的問題是什麼？
- 哪些用戶會使用這個篩選功能？

### Acceptance Criteria (驗收標準)
- 什麼情況下算是篩選成功？
- 如何驗證篩選結果正確？

### Requirements (具體需求)
- 要篩選哪些欄位？(例如：難度、課本、單元)
- 篩選器要放在頁面的哪個位置？
- 是單選還是多選？
- 預設狀態是什麼？

### Interactions (互動流程)
- 使用者選擇篩選條件後，立即生效還是需要按確認按鈕？
- 篩選後的結果要如何顯示？
- 如何清除篩選條件？

### Outputs (預期結果)
- 如果沒有符合的結果，要顯示什麼訊息？
- 篩選結果的排序規則是什麼？
```

**Status**: ⏸️ WAIT for user answers before implementation

### Example 2: Clear Request

**User Input:**
```
在 VocabularyList 組件右上角新增一個下拉選單，讓使用者可以選擇課本（單選），
選擇後立即篩選顯示該課本的單字。如果選擇「全部」則顯示所有單字。
預設顯示「全部」。
```

**CARIO Analysis:**
- Context: ✅ Clear (user wants to filter by textbook)
- Acceptance: ✅ Clear (filters immediately on selection)
- Requirements: ✅ Clear (dropdown, single select, top-right position)
- Interactions: ✅ Clear (immediate effect on selection)
- Outputs: ✅ Clear ("全部" shows all, specific textbook shows filtered)

**Decision**: ✅ PROCEED to implementation (no clarification needed)

## Integration with Other Skills

### Works With:
- **requirements-parser**: Analyzes requirement and identifies ambiguous areas
- **debugging**: If implementation fails, re-check if requirements were unclear
- **failed-fix-clarification**: After 2 failed attempts, re-apply CARIO framework

### Decision Logic:
```
User Request
    ↓
requirements-parser (extract requirements)
    ↓
Is requirement clear? (CARIO check)
    ├─ YES → Proceed to implementation
    └─ NO → requirements-clarification (ask CARIO questions)
            ↓
        Wait for user answers
            ↓
        Document clarified requirements
            ↓
        Proceed to implementation
```

## WordGym Students Specific Considerations

### Common Ambiguous Patterns
Based on real project issues:

1. **"像上一個版本"** (like previous version)
   - AMBIGUOUS: Which version? What specific behavior?
   - ASK: "請具體說明是哪個版本？要模仿哪個行為？"

2. **"寬度一樣"** (same width)
   - AMBIGUOUS: Same as what? Fixed width or responsive?
   - ASK: "要跟哪個元素一樣寬？固定寬度還是響應式？"

3. **"改進 UI"** (improve UI)
   - AMBIGUOUS: What specifically to improve?
   - ASK: "請具體說明要改進哪些部分？預期效果是什麼？"

4. **"修復 bug"** (fix bug)
   - AMBIGUOUS: What's the expected behavior?
   - ASK: "預期行為是什麼？目前哪裡不對？"

### Project Constraints to Consider
When clarifying requirements, always remind user of:
- **Single HTML output**: Bundle size matters
- **TypeScript strict**: Need exact types
- **TDD required**: Need testable acceptance criteria
- **Tailwind CSS**: Prefer utility classes over custom CSS

## Token Economy
- Activation cost: ~100 tokens (hook overhead)
- Clarification questions: ~200-500 tokens
- Total overhead: ~300-600 tokens
- **ROI**: Prevents 1-3 failed implementation attempts (saves 5,000-15,000 tokens)

## Success Metrics
- **Target**: 90%+ requirements clarity before implementation
- **Measure**: Track how many implementations succeed on first attempt
- **Current baseline**: TBD (track over next 10 issues)

## References
- `.claude/skills/requirements-parser.md` - Extracts and analyzes requirements
- `.claude/rules/root-cause-analysis.md` - 5 Whys methodology
- Issue #19 (real example) - Prevented 3rd failed attempt via clarification

---

**Version**: 1.0
**Last Updated**: 2025-12-31
**Status**: ACTIVE (force_activation: true)
