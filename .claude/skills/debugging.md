# Debugging Skill

## Purpose
Systematic debugging workflow using a 5-step checklist. Prevents blind trial-and-error debugging and ensures root cause analysis before fixes.

## Auto-Activation Keywords
This skill auto-activates when user messages contain:
- bug, error, debug
- 不work, 壞掉, 失敗 (not working, broken, failed)
- 有問題, 錯誤, 修復 (has problem, error, fix)

**Priority**: CRITICAL (force_activation: true)

## The 5-Step Debugging Process

### Step 1: Reproduce the Issue 🔄
**Goal**: Confirm the bug exists and understand when it occurs

**Actions:**
1. Read the bug report or user description
2. Identify the exact steps to reproduce
3. Determine the affected components/files
4. Note the expected vs actual behavior

**WordGym Students Specific:**
- Which page/component? (Vocabulary, Flashcard, Quiz, Exam, etc.)
- Which data source? (vocabulary.json, exam settings, etc.)
- Browser console errors? (Check DevTools)
- Build errors? (npm run build output)

**Checklist:**
- [ ] Can reproduce the issue consistently
- [ ] Know the exact steps to trigger the bug
- [ ] Understand what should happen vs what actually happens
- [ ] Identified the affected component(s)

**Output Format:**
```markdown
## Bug Reproduction

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Affected Components:**
- [Component 1]
- [Component 2]
```

---

### Step 2: Check Logs & Error Messages 📋
**Goal**: Gather diagnostic information before making changes

**Actions:**
1. Check browser console (DevTools → Console)
2. Check TypeScript errors (npm run build)
3. Review React component warnings
4. Check network tab for API/data loading issues

**WordGym Students Specific Checks:**
- **Type Errors**: `npm run build` → TypeScript strict mode errors
- **Console Warnings**: React hooks dependencies, key props, etc.
- **Data Issues**: vocabulary.json loading, parsing errors
- **Build Issues**: Vite bundling, CSS inlining, asset loading
- **Bundle Size**: Check if exceeds 3MB threshold

**Common Error Patterns:**
```typescript
// Pattern 1: Type mismatch
Property 'X' does not exist on type 'Y'
→ Check interface definitions

// Pattern 2: Undefined values
Cannot read property 'X' of undefined
→ Check data loading, null checks

// Pattern 3: React warnings
Warning: Each child in a list should have a unique "key" prop
→ Add key prop to mapped components

// Pattern 4: Hook dependency warnings
React Hook useEffect has a missing dependency
→ Add to dependency array or fix with useCallback
```

**Checklist:**
- [ ] Reviewed browser console errors
- [ ] Ran `npm run build` and checked TypeScript errors
- [ ] Checked network tab for data loading issues
- [ ] Reviewed React warnings and component errors
- [ ] Documented all error messages

**Output Format:**
```markdown
## Diagnostic Information

**Console Errors:**
```
[Copy error messages here]
```

**TypeScript Errors:**
```
[npm run build output]
```

**React Warnings:**
- [Warning 1]
- [Warning 2]
```

---

### Step 3: Root Cause Analysis (5 Whys) 🔍
**Goal**: Find the TRUE root cause, not just symptoms

**Actions:**
1. Apply 5 Whys methodology (see `.claude/rules/root-cause-analysis.md`)
2. Distinguish between symptoms and root causes
3. Identify if fixing in multiple places = wrong approach
4. Trace issue back to source (data, logic, UI)

**Decision Tree:**
```
Bug appears in UI component
    ↓
Why? → Component displays wrong data
    ↓
Why? → Data from props is incorrect
    ↓
Why? → Parent component passes wrong data
    ↓
Why? → Data transformation logic is flawed
    ↓
Why? → Source data format changed
    ↓
ROOT CAUSE: csv_to_json.py doesn't handle new format
```

**Red Flags (Wrong Approach):**
- ❌ Fixing same issue in 3+ components
- ❌ Adding workarounds without understanding why
- ❌ "Code looks right, should work" without verification
- ❌ Assuming behavior without testing

**Correct Approach:**
- ✅ Fix at source (data conversion, API, state management)
- ✅ Question "why am I fixing this here?"
- ✅ Verify actual behavior via browser testing
- ✅ One fix, not multiple patches

**Checklist:**
- [ ] Applied 5 Whys analysis
- [ ] Identified root cause (not symptom)
- [ ] Confirmed fixing at the correct layer
- [ ] Not fixing same issue in multiple places

**Output Format:**
```markdown
## Root Cause Analysis

**Problem Statement:**
[Clear description of the bug]

**5 Whys:**
1. Why? → [Answer 1]
2. Why? → [Answer 2]
3. Why? → [Answer 3]
4. Why? → [Answer 4]
5. Why? → [Answer 5]

**Root Cause:**
[The TRUE underlying cause]

**Fix Location:**
[Where to fix - source vs downstream]
```

---

### Step 4: Implement Fix 🔧
**Goal**: Fix the root cause with minimal changes

**Actions:**
1. Write a test first (TDD) that fails due to the bug
2. Implement the minimal fix at the root cause location
3. Verify the test passes
4. Check for side effects

**WordGym Students Specific:**
- **Data fixes**: Update csv_to_json.py or vocabulary.json
- **Type fixes**: Update interfaces in types.ts
- **Logic fixes**: Update component logic
- **UI fixes**: Update Tailwind classes or component structure

**TDD Workflow:**
```typescript
// 1. Write failing test
test('should display clean english word without POS annotations', () => {
  const word = { english_word: 'apple (n.)' };
  render(<WordCard word={word} />);
  expect(screen.getByText('apple')).toBeInTheDocument();
  expect(screen.queryByText('(n.)')).not.toBeInTheDocument();
});

// 2. Run test → FAILS ❌

// 3. Implement fix
const cleanEnglishWord = word.english_word.replace(/\s*\([^)]*\)/g, '');

// 4. Run test → PASSES ✅
```

**Code Quality Checks:**
- Use TypeScript strict mode (no `any` types)
- Follow existing code patterns
- Keep components focused and single-responsibility
- Consider bundle size impact (single HTML output)

**Checklist:**
- [ ] Wrote test first (TDD)
- [ ] Fixed at root cause location
- [ ] Test passes
- [ ] No TypeScript errors
- [ ] No new warnings
- [ ] Build succeeds (`npm run build`)

**Output Format:**
```markdown
## Fix Implementation

**Test Added:**
```typescript
[Test code]
```

**Fix Location:**
[File path and line numbers]

**Fix Description:**
[What changed and why]

**Verification:**
- ✅ Test passes
- ✅ Build succeeds
- ✅ No TypeScript errors
```

---

### Step 5: Test & Verify 🧪
**Goal**: Confirm the fix works and doesn't break anything else

**Actions:**
1. Run all tests (`npm test` if available)
2. Build and preview (`npm run build && npm run preview`)
3. Manual testing in browser
4. Check for regressions in related features
5. Verify bundle size (dist/index.html)

**WordGym Students Test Checklist:**
- [ ] TypeScript compilation passes (`npm run build`)
- [ ] Single HTML output verified (ls dist/ → only 1 file)
- [ ] Bundle size acceptable (< 3MB)
- [ ] CSS/JS properly inlined (view source)
- [ ] Manual testing in browser (open dist/index.html)
- [ ] Related features still work
- [ ] No console errors
- [ ] Responsive design intact (mobile/desktop)

**Manual Testing Workflow:**
```bash
# 1. Clean build
rm -rf dist
npm run build

# 2. Verify single file output
ls -lh dist/index.html
du -h dist/index.html

# 3. Preview in browser
npm run preview

# 4. Test affected features
# - Navigate to affected page
# - Reproduce original issue → Should be fixed ✅
# - Test related features → Should still work ✅
# - Check console → No errors ✅
```

**Regression Testing:**
- If fixing Vocabulary page, test Flashcard/Quiz using same data
- If fixing data loading, test all pages that use that data
- If fixing UI component, test all usages of that component
- If fixing state management, test all state-dependent features

**Checklist:**
- [ ] All tests pass
- [ ] Build succeeds with no errors
- [ ] Manual browser testing confirms fix
- [ ] No regressions in related features
- [ ] Bundle size within limits
- [ ] No new console errors or warnings

**Output Format:**
```markdown
## Verification Results

**Build Status:**
✅ TypeScript compilation: PASS
✅ Bundle size: [X MB / 3MB limit]
✅ Single file output: VERIFIED

**Manual Testing:**
✅ Original issue: FIXED
✅ Related feature 1: WORKING
✅ Related feature 2: WORKING
✅ Console: NO ERRORS

**Regression Check:**
- [Feature 1]: ✅ Working
- [Feature 2]: ✅ Working
- [Feature 3]: ✅ Working
```

---

## Complete Debugging Workflow Summary

```
🐛 BUG REPORTED
    ↓
Step 1: REPRODUCE
    ├─ Identify steps to reproduce
    ├─ Confirm expected vs actual behavior
    └─ Note affected components
    ↓
Step 2: CHECK LOGS
    ├─ Browser console errors
    ├─ TypeScript errors (npm run build)
    ├─ React warnings
    └─ Network/data issues
    ↓
Step 3: ROOT CAUSE (5 Whys)
    ├─ Apply 5 Whys analysis
    ├─ Find true root cause
    ├─ Identify fix location (source vs symptom)
    └─ Avoid fixing in multiple places
    ↓
Step 4: IMPLEMENT FIX
    ├─ Write test first (TDD)
    ├─ Fix at root cause location
    ├─ Verify test passes
    └─ Check build succeeds
    ↓
Step 5: TEST & VERIFY
    ├─ Run all tests
    ├─ Build and preview
    ├─ Manual browser testing
    ├─ Regression testing
    └─ Verify bundle size
    ↓
✅ BUG FIXED
```

## Integration with Other Skills

### Works With:
- **requirements-parser**: If bug is due to unclear requirements, parse and clarify
- **failed-fix-clarification**: After 2 failed fix attempts, stop and ask for clarity
- **git-issue-pr-flow**: Document fix in issue comments and PR description

### Decision Logic:
```
Bug Report
    ↓
debugging skill (5-step process)
    ↓
Fix Attempt #1
    ├─ SUCCESS ✅ → Document in issue → Close issue
    └─ FAILED ❌ → Re-apply steps 2-3
            ↓
        Fix Attempt #2
            ├─ SUCCESS ✅ → Document learning → Close issue
            └─ FAILED ❌ → failed-fix-clarification
                    ↓
                Ask user for clarification
                    ↓
                Fix Attempt #3 (after clarification)
```

## Common WordGym Students Bug Patterns

Based on real project issues:

### Pattern 1: Data Display Issues
**Symptom**: UI shows wrong data or formatting
**Root Cause**: Often in data source (vocabulary.json) or data transformation
**Fix Location**: csv_to_json.py or data loading logic

**Example**: POS annotations showing in UI
- ❌ Wrong: Fix in every component that displays english_word
- ✅ Right: Clean data at source (csv_to_json.py)

### Pattern 2: Type Errors
**Symptom**: TypeScript compilation errors
**Root Cause**: Interface mismatch or missing type definitions
**Fix Location**: types.ts or component props

**Example**: Property doesn't exist on type
- ❌ Wrong: Use `any` type to bypass
- ✅ Right: Update interface or fix property name

### Pattern 3: React Warnings
**Symptom**: Console warnings during development
**Root Cause**: Missing keys, dependency arrays, or prop types
**Fix Location**: Component definition

**Example**: Missing key prop in list
- ❌ Wrong: Use index as key
- ✅ Right: Use unique ID from data

### Pattern 4: Build Errors
**Symptom**: Build fails or bundle too large
**Root Cause**: Import errors, circular dependencies, or large assets
**Fix Location**: Import statements or asset optimization

**Example**: Bundle exceeds 3MB
- ❌ Wrong: Increase limit
- ✅ Right: Optimize imports, lazy load, or compress assets

## Token Economy
- Activation cost: ~100 tokens (hook overhead)
- 5-step process execution: ~500-1,000 tokens
- Total overhead: ~600-1,100 tokens
- **ROI**: Prevents 2-3 blind fix attempts (saves 10,000-30,000 tokens)

## Success Metrics
- **Target**: 80%+ bugs fixed on first or second attempt
- **Measure**: Track fix attempts per issue
- **Current baseline**: TBD (track over next 20 bug reports)

## References
- `.claude/rules/root-cause-analysis.md` - 5 Whys methodology
- `.claude/skills/failed-fix-clarification.md` - Escalation after 2 failed attempts
- `.claude/agents/test-runner.md` - Build verification workflow

---

**Version**: 1.0
**Last Updated**: 2025-12-31
**Status**: ACTIVE (force_activation: true)
