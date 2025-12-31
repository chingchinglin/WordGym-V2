# Debugging Skill

## Purpose
Systematic debugging workflow using a 5-step checklist. Prevents blind trial-and-error debugging and ensures root cause analysis before fixes.

## Auto-Activation Keywords
- bug, error, debug
- 不work, 壞掉, 失敗 (not working, broken, failed)
- 有問題, 錯誤, 修復 (has problem, error, fix)

**Priority**: CRITICAL (force_activation: true)

## The 5-Step Process

### Step 1: Reproduce the Issue 🔄
- Identify exact steps to reproduce
- Note expected vs actual behavior
- Identify affected components

### Step 2: Check Logs & Errors 📋
Run bundled diagnostic scripts:
```bash
# TypeScript type checking
./.claude/skills/debugging/scripts/check-typescript.sh

# Bundle size verification
./.claude/skills/debugging/scripts/check-bundle-size.sh

# Build analysis
./.claude/skills/debugging/scripts/analyze-build.py
```

### Step 3: Root Cause Analysis 🔍
Apply 5 Whys methodology (see `.claude/rules/root-cause-analysis.md`):
- Why? → Why? → Why? → Why? → Why? → ROOT CAUSE

**Red Flags:**
- ❌ Fixing same issue in 3+ places
- ❌ "Code looks right, should work" without verification
- ❌ Adding workarounds without understanding why

**Correct Approach:**
- ✅ Fix at source (data, API, state)
- ✅ Question "why am I fixing this here?"
- ✅ Verify via browser testing

### Step 4: Implement Fix 🔧
**TDD Workflow:**
1. Write failing test
2. Implement minimal fix at root cause
3. Verify test passes
4. Check build succeeds

### Step 5: Test & Verify 🧪
```bash
# Clean build
rm -rf dist && npm run build

# Verify output
ls -lh dist/index.html

# Test UI interactions (requires Playwright)
./.claude/skills/debugging/scripts/test-ui-playwright.cjs
```

## WordGym Students Constraints
- **Bundle size**: < 3MB (single HTML output)
- **TypeScript**: Strict mode, no `any` types
- **TDD**: Write test first
- **Tailwind**: Utility-first CSS

## Common Bug Patterns

### Pattern 1: Data Display Issues
**Root Cause**: Data source (vocabulary.json) or transformation
**Fix Location**: csv_to_json.py or data loading logic

### Pattern 2: Type Errors
**Root Cause**: Interface mismatch or missing types
**Fix Location**: types.ts or component props

### Pattern 3: React Warnings
**Root Cause**: Missing keys, dependency arrays
**Fix Location**: Component definition

### Pattern 4: Build Errors
**Root Cause**: Import errors, large assets
**Fix Location**: Import statements or asset optimization

## Token Economy
- Activation: ~100 tokens
- Execution: ~500 tokens
- **ROI**: Prevents 2-3 blind fix attempts (saves 10,000-30,000 tokens)

---

**Version**: 2.0-AMP
**Last Updated**: 2025-12-31
