# WordGym Students - Project Configuration

This is the project-specific configuration for WordGym Students (单字健身坊 - 学生版).

## Project Overview

**Tech Stack:**
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.0.8
- Tailwind CSS 3.4.0
- vite-plugin-singlefile 0.13.5 (single HTML output)

**Development Methodology:**
- Test-Driven Development (TDD)
- git-issue-pr-flow workflow

## Code Quality Standards

### TypeScript
- Use strict mode
- No `any` types without explicit justification
- Prefer interfaces over types for object shapes
- Use proper type inference, avoid redundant type annotations

### React Best Practices
- Functional components with hooks
- Proper dependency arrays in useEffect/useCallback/useMemo
- Avoid inline function definitions in JSX props
- Use React.memo for expensive components
- Keep components focused and single-responsibility

### Code Style
- Remove hedging language ("might", "could potentially", "perhaps")
- Remove agreement phrases ("I understand", "Sure", "Of course")
- Be direct and specific in technical communication
- Prefer explicit over implicit

## Single HTML Build Configuration

**CRITICAL:** This project uses `vite-plugin-singlefile` to generate a single HTML file output.

**Key Considerations:**
- All CSS is inlined (Tailwind)
- All JavaScript is bundled inline
- No external asset references in production build
- Build output: `dist/index.html` (self-contained)

**Testing the build:**
```bash
npm run build
npm run preview
```

## TDD Workflow

When implementing features:

1. **Write test first** - Define expected behavior
2. **Run test** - Confirm it fails
3. **Implement** - Write minimal code to pass
4. **Refactor** - Clean up while keeping tests green
5. **Commit** - Use conventional commit format

## Git Workflow

### Branch Naming
- Feature: `feature/[issue-number]-short-description`
- Bugfix: `fix/[issue-number]-short-description`
- Refactor: `refactor/[issue-number]-short-description`

### Commit Messages
Follow Conventional Commits:
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:** feat, fix, refactor, test, docs, style, chore

**Examples:**
```
feat(vocabulary): add word card component
fix(auth): resolve login state persistence
test(vocabulary): add word card interaction tests
refactor(ui): extract common button styles
```

### PR Process
1. Create issue first
2. Create branch from issue
3. Implement with TDD
4. Create PR referencing issue
5. Ensure all tests pass
6. Request review if needed

## Context Management

**Use /clear when:**
- Starting a new feature
- Switching between bug fix and feature work
- Context exceeds 50k tokens
- Changing focus areas significantly

## Development Practices

### File Organization
- Components: Small, focused, single-responsibility
- Test files: Co-located with component files (`.test.tsx`)
- Avoid deep nesting (max 3-4 levels)

### Performance
- Lazy load routes/components when appropriate
- Optimize Tailwind (use JIT mode)
- Monitor bundle size (single file output matters)

### Security
- Validate all user inputs
- Sanitize data before rendering
- No hardcoded secrets or API keys
- Use environment variables for config

## Anti-Patterns to Avoid

**Don't:**
- Create documentation files unless explicitly requested
- Use `any` type without justification
- Skip tests (this is a TDD project)
- Commit without following conventional commit format
- Create PRs without linking to issues
- Bundle unnecessary dependencies (affects single HTML size)

## Build Verification

Before committing:
```bash
# Ensure types are correct
npm run build

# Verify single HTML output
ls -lh dist/index.html

# Test the build
npm run preview
```

## Project-Specific Reminders

1. **Single HTML output:** Be mindful of bundle size, every dependency is inlined
2. **Chinese + English:** UI may have bilingual content
3. **Student-focused:** UX should be simple and clear for students
4. **Tailwind utility-first:** Use Tailwind classes, avoid custom CSS when possible
5. **TypeScript strict:** No type errors, no type workarounds

## Universal Skills & Agents

### Project-Specific Skills (AMP-Style)

Following Sourcegraph AMP philosophy and Claude Code official best practices, our skills are structured as:
- **Concise SKILL.md** (< 2KB) - Guidance and workflow
- **Executable scripts/** - Small, focused tools (< 50 lines each)
- **Token-efficient** - Scripts run without loading into context

**Location:** `.claude/skills/`

| Skill | Purpose | Bundled Scripts | Auto-Activation |
|-------|---------|-----------------|-----------------|
| **debugging/** | 5-step systematic debugging workflow | `check-typescript.sh`<br>`check-bundle-size.sh`<br>`analyze-build.py`<br>`test-ui-playwright.cjs` | bug, error, debug, 不work, 壞掉 |
| **requirements/** | CARIO framework for requirement clarification | `check-clarity.cjs`<br>`generate-questions.cjs` | 需求, requirement, 客戶要, 新功能 |

**AMP Philosophy Applied:**
- Each script < 50 lines (most < 20)
- Single, clear purpose per script
- Executable, not documentation
- Saves ~16KB markdown → ~400 lines executable code

**Example Usage:**
```bash
# Check TypeScript types (debugging skill)
./.claude/skills/debugging/scripts/check-typescript.sh

# Check bundle size (debugging skill)
./.claude/skills/debugging/scripts/check-bundle-size.sh

# Analyze build breakdown (debugging skill)
./.claude/skills/debugging/scripts/analyze-build.py

# Check requirement clarity (requirements skill)
./.claude/skills/requirements/scripts/check-clarity.cjs "客戶要加篩選功能"

# Generate clarification questions (requirements skill)
./.claude/skills/requirements/scripts/generate-questions.cjs "客戶要加篩選功能"
```

**Skills Auto-Activation:**
- ✅ Auto-activate when you use trigger keywords
- ✅ Scripts execute without loading into context (saves tokens)
- ✅ SKILL.md provides concise guidance
- ⚠️ Archived verbose versions in `.claude/skills/archive/`

### Project-Specific Agents

These agents are defined in `.claude/agents/` and handle specific tasks for WordGym Students:

| Agent | Model | Purpose | When to Use |
|-------|-------|---------|-------------|
| **agent-manager** | Haiku | Mandatory routing system for all coding tasks | AUTO-INVOKED on every task to determine optimal agent delegation |
| **git-issue-pr-flow** | Sonnet | Complete PDCA workflow for GitHub Issues | Issue fixes, PR management, Chrome verification |
| **tdd-validator-agent** | Sonnet | Enforce TDD discipline and test coverage | New features, bug fixes, UI components |
| **code-reviewer** | Sonnet | Security, performance, best practices review | Code review, quality checks, bundle size analysis |
| **test-runner** | Haiku | Vite build testing and validation | Build verification, TypeScript checking, preview testing |

**Agent Usage Patterns:**

#### Pattern 1: Issue Fix (Full PDCA)
```yaml
User: "修復 #15"
→ agent-manager routes to git-issue-pr-flow
→ PDCA Plan (5 Whys analysis)
→ tdd-validator-agent enforces TDD
→ test-runner validates build
→ code-reviewer checks quality
→ git-issue-pr-flow handles PR + Chrome verification
```

#### Pattern 2: New Feature Development
```yaml
User: "添加新的單詞卡片組件"
→ agent-manager routes to tdd-validator-agent
→ TDD Red-Green-Refactor enforced
→ test-runner validates build
→ code-reviewer checks bundle size impact
```

#### Pattern 3: Build Testing
```yaml
User: "測試構建"
→ agent-manager routes to test-runner
→ TypeScript type checking
→ Vite build
→ Single HTML validation
→ Preview server test
```

### Agent Coordination (Automatic)

The **agent-manager** automatically routes tasks based on:
- Issue references (#N)
- Task type (test, review, fix)
- Context signals (file changes, git status)
- Project constraints (bundle size, TDD requirements)

**You don't need to manually invoke agents** - the agent-manager handles routing automatically.

### Root Cause Analysis Integration

Before any implementation, **MUST** apply 5 Whys methodology (see `.claude/rules/root-cause-analysis.md`):

1. State the problem clearly
2. Ask "Why?" 5 times
3. Identify true root cause
4. Verify solution scope (fixing in 3+ places = wrong approach)
5. Implement at source level

**Example:**
```
Problem: Quiz options show "(adj.)" annotations

Why? → Quiz displays raw english_word field
Why? → useDataset doesn't clean the field
Why? → vocabulary.json contains dirty data
Why? → csv_to_json.py doesn't strip annotations
Why? → No cleaning logic exists at source

Root Cause: CSV converter lacks data cleaning
Solution: Fix csv_to_json.py, NOT downstream components ✅
```

### Chrome Verification (UI Changes)

For all UI changes, **MUST** verify via Chrome automation:
- Take screenshots BEFORE and AFTER
- Compare visual evidence
- Verify actual user experience
- Document in issue comments

See `.claude/rules/chrome-verification.md` for detailed workflow.

### Hooks Configuration (Auto-Activation)

**Location**: `.claude/hooks/skill-activation-hook.sh`
**Config**: `.claude/config/skill-rules.json`

The project uses **keyword-based skill auto-activation** with 75-80% success rate:

```
用户输入关键词 → Hook 分析 → 自动注入 Skill() 命令 → Skills 激活
```

#### Configured Triggers:

| Trigger Keywords | Auto-Activates | Priority |
|-----------------|----------------|----------|
| "需求", "客戶要", "新功能" | requirements-clarification | 🔴 Critical |
| "bug", "error", "壞掉", "修復" | debugging | 🔴 Critical |
| "#N", "issue", "PR", "commit" | git-issue-pr-flow (via agent-manager) | 🟡 High |
| "新組件", "component", "TDD" | tdd-validator-agent (via agent-manager) | 🟡 High |
| "test", "build", "構建" | test-runner (via agent-manager) | 🟢 Medium |
| "review", "審查", "bundle size" | code-reviewer (via agent-manager) | 🟢 Medium |

#### How It Works:

**Example 1: Requirements Clarification**
```
User: "客戶要加一個篩選功能"
→ Hook detects "客戶要" keyword
→ Injects: Skill(skill="requirements-clarification")
→ CARIO framework automatically applies
```

**Example 2: Debugging**
```
User: "有個 bug 需要修復"
→ Hook detects "bug" + "修復" keywords
→ Injects: Skill(skill="debugging")
→ 5-step systematic workflow applies
```

**Example 3: Issue Fix**
```
User: "修復 #15"
→ Hook detects "#" keyword
→ agent-manager routes to git-issue-pr-flow
→ Full PDCA workflow starts
```

#### Testing the Hook:

```bash
# Test requirements trigger
echo "客戶要一個新功能" | ./.claude/hooks/skill-activation-hook.sh

# Test debugging trigger
echo "有個 bug" | ./.claude/hooks/skill-activation-hook.sh

# Test issue trigger
echo "修復 #15" | ./.claude/hooks/skill-activation-hook.sh
```

#### Customizing Keywords:

Edit `.claude/config/skill-rules.json` to add more trigger keywords:

```json
{
  "skills": {
    "requirements-clarification": {
      "keywords": ["需求", "客戶要", "新功能", "your-new-keyword"],
      "priority": "critical"
    }
  }
}
```

See `.claude/hooks/README.md` for full documentation.

---

*WordGym Students Configuration | React 18 + TypeScript + Vite + Single HTML*

## 🚨 CRITICAL: Issue Closure Policy - Client Confirmation Required

**規範等級**: CRITICAL - 絕對禁止違反
**適用範圍**: 所有 GitHub Issue 管理

### 核心原則

> **AI 不能主動關閉 Issue。只有案主確認後，Issue 才能關閉。**

### Issue 生命週期

```
[Issue 開啟] → [開發修復] → [推送代碼] → [PR 合併] → [部署完成]
                                                        ↓
                                              [等待案主測試] ← 強制等待點
                                                        ↓
                                              [案主確認通過]
                                                        ↓
                                              [Issue 關閉]
```

### 關閉條件判斷

| 條件 | 可以關閉？ |
|------|-----------|
| 代碼已實現 | ❌ 不能 |
| 測試通過 | ❌ 不能 |
| PR 已合併 | ❌ 不能 |
| 已部署到生產環境 | ❌ 不能 |
| AI Code Review 通過 | ❌ 不能 |
| Chrome 驗證通過 | ❌ 不能 |
| **案主說「測試通過」** | ✅ 可以關閉 |

### ⚠️ 重要教訓：Chrome 驗證 ≠ 案主確認

> **AI 的 Chrome 截圖驗證 ≠ 案主的業務確認**
>
> - Chrome 驗證只證明「畫面看起來對」
> - 案主確認才證明「業務需求滿足」
> - 兩者完全不同！

**錯誤範例**：
```
AI: Chrome 截圖顯示 2 行格式正確 → 關閉 Issue
❌ 這是錯誤的！沒有案主說「測試通過」
```

**正確流程**：
```
AI: Chrome 截圖驗證通過 → 留言等待案主測試 → 案主說「測試通過」→ 關閉 Issue
✅ 這才是正確的！
```

### 案主確認的有效形式

**中文確認**：
- 「測試通過」、「测试通过」
- 「OK」、「好」、「沒問題」、「没问题」
- 「可以關閉」、「可以关闭」
- 「確認」、「驗收通過」

**英文確認**：
- "LGTM", "approved", "looks good", "works"

**Emoji 確認**：
- ✅, 👍

### 違規處理

如果錯誤關閉 Issue：
```bash
# 1. 立即重新開啟
gh issue reopen <NUM>

# 2. 留言說明
gh issue comment <NUM> --body "⚠️ 此 Issue 尚未經案主測試確認，已重新開啟。請案主測試後回覆確認。"

# 3. 等待案主確認後才能再次關閉
```

### 為什麼這條規則如此重要？

1. **AI 無法代替人類判斷** - 代碼通過不代表業務需求滿足
2. **案主是最終驗收者** - 只有案主知道修復是否符合期望
3. **防止過早關閉** - 避免案主測試時發現 Issue 已被關閉
4. **建立信任** - 讓案主感受到專業的工作流程

**記住：寧可多等一天，不可錯關一個 Issue。**

---

## CRITICAL: Task Completion Enforcement

### Mandatory Rules - NO EXCEPTIONS

1. **NO PARTIAL COMPLETION**
   - ❌ FORBIDDEN: "Phase 1 done, Phase 2 tomorrow"
   - ❌ FORBIDDEN: "Core features done, UI later"
   - ✅ REQUIRED: 100% completion before stopping

2. **NO CODE DELETION TO AVOID ERRORS**
   - ❌ FORBIDDEN: Delete broken code due to type errors
   - ✅ REQUIRED: Fix errors with find/replace, refactoring, etc.
   - Example: 80 type errors? Fix them, don't delete files

3. **ERROR HANDLING PROCESS**
   - Step 1: Analyze error pattern (field name mismatch, etc.)
   - Step 2: Apply batch fixes (find/replace across files)
   - Step 3: Verify compilation success
   - Step 4: Continue to next step

4. **COMPLETION CHECKLIST**
   - [ ] All planned features implemented
   - [ ] `npm run build` succeeds
   - [ ] `open dist/index.html` works as expected
   - [ ] All commits pushed
   - [ ] Issue updated with completion status

### Consequences of Violation

If you cannot complete a task:
- SAY SO AT THE START: "I cannot complete this task because..."
- DO NOT start and abandon halfway
- DO NOT find excuses after starting

**Remember:** The user expects completion, not excuses.

## AI Capability Limitations & Compensation Strategies

### Known Limitations

1. **Visual Understanding Deficit**
   - ❌ AI cannot "see" rendered web pages like humans
   - ❌ Cannot intuitively spot layout/styling issues
   - ✅ MUST use Chrome automation for all UI verification
   - ✅ MUST provide screenshot evidence

2. **Root Cause Analysis Bias**
   - ❌ AI tends to fix symptoms (UI display) rather than root causes (source data)
   - ❌ Lack of "common sense" to question "why am I fixing this in 3 places?"
   - ✅ MUST apply 5 Whys methodology before implementation
   - ✅ MUST escalate to human when fixing same issue in multiple locations

3. **Product Intuition Gap**
   - ❌ AI follows "代碼能跑就行" mentality (if it compiles, ship it)
   - ❌ Cannot detect "這樣很蠢，肯定哪裡不對" (intuitive wrongness)
   - ✅ MUST seek human validation for architectural decisions
   - ✅ MUST verify actual user experience, not just code correctness

### Compensation Strategies

#### Chrome Verification前置化
- Take screenshots BEFORE and AFTER fixes
- Compare evidence to verify actual behavior
- Document visual changes in issue comments

#### Mandatory Root Cause Analysis
- Apply 5 Whys before writing code
- Question assumptions when fixing in multiple places
- Seek human insight for systemic issues

#### Human-AI Collaboration Optimization
- AI provides evidence (screenshots, analysis)
- Human validates architectural decisions
- Human spots systemic problems AI misses
- AI executes fixes at correct layer

#### Client Feedback Triggers改進
- After client-feedback-1: Deep analysis of failure mode
- After client-feedback-2: Escalate complexity, seek human review
- After client-feedback-3+: Human takes over

### Remember
The user expects **completion**, not excuses. If you cannot complete a task due to these limitations, **SAY SO AT THE START** and explain which limitation applies.
