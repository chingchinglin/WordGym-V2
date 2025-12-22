# Git Workflow Guide - WordGym Students

**Issue-Branch-PR-Deploy-Verify Flow**

This document describes the complete workflow for developing features and fixing bugs in the WordGym Students project.

---

## Workflow Overview

```
Issue Investigation
      ↓
Create Feature Branch (issue-X-description)
      ↓
Implement & Test Locally
      ↓
Create Pull Request
      ↓
Code Review
      ↓
Merge to Main
      ↓
GitHub Actions Deploy to github.io
      ↓
Chrome Automated Verification
      ↓
Update Issue or Close Issue
```

---

## Step-by-Step Workflow

### 1. 查勘 Issue (Issue Investigation)

**Goal:** Understand the problem before writing code.

**Actions:**
```bash
# View issue details
gh issue view <issue-number>

# Example
gh issue view 4
```

**What to look for:**
- Requirements and acceptance criteria
- Expected behavior vs current behavior
- Affected files and components
- Related issues or dependencies
- Labels and priority

**Tips:**
- Add clarifying questions as comments if requirements are unclear
- Check if issue is already assigned to avoid duplicate work
- Review linked PRs or related issues

---

### 2. 建立 Issue Branch (Create Issue Branch)

**Goal:** Work in isolation without affecting main branch.

**Branch Naming Convention:**
```
issue-<number>-<short-description>
```

**Examples:**
```bash
# Feature
git checkout -b issue-4-video-display

# Bug fix
git checkout -b issue-12-fix-quiz-crash

# Refactor
git checkout -b issue-8-refactor-state-management
```

**Commands:**
```bash
# Ensure you're on latest main
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b issue-<number>-<description>

# Verify branch
git branch --show-current
```

**Best Practices:**
- Always branch from latest main
- Keep branch name short but descriptive
- Use lowercase with hyphens (kebab-case)
- Include issue number for traceability

---

### 3. 開始修復 (Start Fixing)

**Goal:** Implement the solution following TDD and project standards.

**TDD Process:**

1. **Write test first**
   ```typescript
   // WordCard.test.tsx
   it('should display video when videoUrl is provided', () => {
     // Test implementation
   });
   ```

2. **Run test (should fail)**
   ```bash
   npm test
   ```

3. **Implement feature**
   ```typescript
   // WordCard.tsx
   // Add video display logic
   ```

4. **Run test (should pass)**
   ```bash
   npm test
   ```

5. **Refactor**
   - Clean up code
   - Remove duplication
   - Improve readability

**Local Testing:**
```bash
# Type check
npm run build

# Start dev server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Open production build directly
open dist/index.html
```

**Commit Early, Commit Often:**
```bash
# Stage changes
git add <files>

# Commit with conventional format
git commit -m "type(scope): description"

# Examples
git commit -m "feat(word-detail): add video display component"
git commit -m "test(word-detail): add video display tests"
git commit -m "fix(quiz): resolve state reset issue"
git commit -m "refactor(ui): extract common button styles"
```

**Conventional Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change without feature/fix
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `chore`: Build process, dependencies, tooling

---

### 4. 發 PR (Create Pull Request)

**Goal:** Request code review and prepare for merge.

**Commands:**
```bash
# Push branch to remote
git push -u origin issue-<number>-<description>

# Create PR using GitHub CLI
gh pr create \
  --title "type: description" \
  --body "Fixes #<issue-number>" \
  --label "ready-for-review"
```

**Example:**
```bash
# Push branch
git push -u origin issue-4-video-display

# Create PR
gh pr create \
  --title "feat: add video display for words with videoUrl" \
  --body "Fixes #4

## Changes
- Added VideoPlayer component
- Updated WordCard to display video when videoUrl exists
- Added tests for video display logic

## Testing
- ✅ Unit tests pass
- ✅ Build succeeds
- ✅ Manual testing in dev mode
- ✅ Preview production build

## Screenshots
[Add screenshots if UI changes]" \
  --label "ready-for-review"
```

**PR Best Practices:**
- Keep PRs small and focused (one issue per PR)
- Write clear title following conventional commit format
- Reference issue number in body (Fixes #X, Closes #X, Resolves #X)
- Include testing checklist
- Add screenshots for UI changes
- Self-review your code before requesting review
- Ensure all tests pass and build succeeds

**PR Template Checklist:**
- [ ] Tests added/updated
- [ ] `npm run build` succeeds
- [ ] Manual testing completed
- [ ] No TypeScript errors
- [ ] Conventional commit format
- [ ] Issue number referenced
- [ ] Screenshots added (if UI changes)

---

### 5. Merge to Main

**Goal:** Integrate approved changes into main branch.

**After Review Approval:**
```bash
# Merge with squash (combines all commits into one)
gh pr merge <pr-number> --squash --delete-branch

# Alternative: merge without squash (preserves commit history)
gh pr merge <pr-number> --merge --delete-branch

# Alternative: rebase (linear history)
gh pr merge <pr-number> --rebase --delete-branch
```

**Example:**
```bash
gh pr merge 15 --squash --delete-branch
```

**Merge Strategies:**

| Strategy | Use When | Result |
|----------|----------|--------|
| `--squash` | Multiple WIP commits | Single clean commit in main |
| `--merge` | Preserve full history | Merge commit + all commits |
| `--rebase` | Linear history preferred | Commits replayed on main |

**Recommended:** Use `--squash` for most cases to keep main history clean.

**Post-Merge:**
```bash
# Update local main
git checkout main
git pull origin main

# Verify branch is deleted
git branch -a

# Clean up local branches
git branch -d issue-<number>-<description>
```

---

### 6. 自動部署 (Auto Deploy)

**Goal:** Automatically deploy to GitHub Pages after merge.

**Automatic Triggers:**
- Every push to `main` branch triggers GitHub Actions
- Workflow builds project: `npm run build`
- Deploys `dist/index.html` to GitHub Pages
- Site URL: `https://youngger9765.github.io/WordGym-students-merge/`

**Monitor Deployment:**
```bash
# Watch current workflow run
gh run watch

# List recent runs
gh run list --limit 5

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

**Deployment Status:**
- ✅ **Success:** Green checkmark, site updated
- ❌ **Failure:** Red X, check logs for errors
- 🟡 **In Progress:** Yellow circle, deployment running

**Common Deployment Issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails | TypeScript errors | Fix errors locally, push fix |
| Build fails | Missing dependencies | Update package.json |
| Deploy fails | Permissions | Check GitHub Pages settings |
| Site not updated | Cache | Hard refresh (Ctrl+Shift+R) |

**GitHub Actions Configuration:**
- Location: `.github/workflows/deploy.yml`
- Node version: 18.x
- Build command: `npm run build`
- Deploy directory: `dist/`

---

### 7. Chrome 驗證 (Browser Verification)

**Goal:** Verify deployed feature works correctly in production.

**Manual Verification:**
```bash
# Open deployed site
open https://youngger9765.github.io/WordGym-students-merge/
```

**Verification Checklist:**
- [ ] Feature works as expected
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Performance is acceptable
- [ ] No regression in existing features

**Automated Verification (Claude Chrome):**

Use Claude Chrome automation to:
1. Navigate to deployed site
2. Test specific feature
3. Take screenshots
4. Verify console logs
5. Report results

**Example Verification Process:**
```markdown
## Verification Results - Issue #4

**Deployed URL:** https://youngger9765.github.io/WordGym-students-merge/

**Test Steps:**
1. Navigate to word detail page
2. Verify video player appears for words with videoUrl
3. Test video playback
4. Check responsive design

**Results:**
- ✅ Video player renders correctly
- ✅ Playback works smoothly
- ✅ Responsive on mobile devices
- ✅ No console errors
- ✅ Page load time < 2s

**Screenshots:**
[Attach screenshots]

**Status:** Verified ✅
```

**Update Issue:**
```bash
# Add verification comment
gh issue comment <issue-number> --body "Verified in production ✅

[Verification details and screenshots]"

# Add verified label
gh issue edit <issue-number> --add-label "verified"

# Close issue if complete
gh issue close <issue-number>
```

---

## Complete Example Workflow

**Scenario:** Add video display feature for words

### Step 1: Investigate
```bash
gh issue view 4
# Output shows: "Add video player for words with videoUrl field"
```

### Step 2: Create Branch
```bash
git checkout main
git pull origin main
git checkout -b issue-4-video-display
```

### Step 3: Implement with TDD

**3a. Write Test**
```typescript
// src/components/WordCard.test.tsx
describe('WordCard', () => {
  it('should display video when videoUrl is provided', () => {
    const word = {
      id: 1,
      english: 'example',
      chinese: '例子',
      videoUrl: 'https://example.com/video.mp4'
    };

    render(<WordCard word={word} />);
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
  });
});
```

**3b. Run Test (fails)**
```bash
npm test
# Test fails: video-player not found
```

**3c. Implement Feature**
```typescript
// src/components/WordCard.tsx
export const WordCard = ({ word }: WordCardProps) => {
  return (
    <div className="word-card">
      <h2>{word.english}</h2>
      <p>{word.chinese}</p>

      {word.videoUrl && (
        <video
          data-testid="video-player"
          src={word.videoUrl}
          controls
          className="w-full mt-4"
        />
      )}
    </div>
  );
};
```

**3d. Run Test (passes)**
```bash
npm test
# All tests pass ✅
```

**3e. Local Testing**
```bash
npm run build
npm run preview
# Open http://localhost:4173
# Test manually in browser
```

**3f. Commit**
```bash
git add src/components/WordCard.tsx src/components/WordCard.test.tsx
git commit -m "feat(word-card): add video display for videoUrl field"
git commit -m "test(word-card): add video display tests"
```

### Step 4: Create PR
```bash
git push -u origin issue-4-video-display

gh pr create \
  --title "feat: add video display for words with videoUrl" \
  --body "Fixes #4

## Changes
- Added video player to WordCard component
- Video appears when word has videoUrl field
- Added tests for video display

## Testing
- ✅ Unit tests pass
- ✅ Build succeeds
- ✅ Manual testing completed

## Screenshots
[Screenshots attached]" \
  --label "ready-for-review"
```

### Step 5: Merge
```bash
# After approval
gh pr merge 15 --squash --delete-branch
```

### Step 6: Monitor Deploy
```bash
gh run watch
# ✅ Deploy workflow succeeded
```

### Step 7: Verify
```bash
# Manual check
open https://youngger9765.github.io/WordGym-students-merge/

# Add verification comment
gh issue comment 4 --body "Verified in production ✅

Tested video display feature:
- ✅ Video player appears correctly
- ✅ Playback works smoothly
- ✅ Responsive design confirmed
- ✅ No console errors

Screenshots: [attached]"

# Close issue
gh issue close 4
```

---

## Quick Reference Commands

### Issue Management
```bash
gh issue list                           # List all issues
gh issue view <number>                  # View issue details
gh issue create                         # Create new issue
gh issue close <number>                 # Close issue
gh issue comment <number> --body "..."  # Add comment
gh issue edit <number> --add-label "..."# Add label
```

### Branch Management
```bash
git checkout main                       # Switch to main
git pull origin main                    # Update main
git checkout -b issue-X-desc            # Create feature branch
git branch --show-current               # Show current branch
git branch -d branch-name               # Delete local branch
```

### Commit Management
```bash
git status                              # Check status
git add <files>                         # Stage files
git commit -m "type(scope): message"    # Commit with message
git log --oneline                       # View commit history
git diff                                # View changes
```

### PR Management
```bash
gh pr create                            # Create PR (interactive)
gh pr list                              # List PRs
gh pr view <number>                     # View PR details
gh pr merge <number> --squash           # Merge with squash
gh pr close <number>                    # Close PR
gh pr review <number> --approve         # Approve PR
```

### Deployment Management
```bash
gh run list                             # List workflow runs
gh run watch                            # Watch current run
gh run view <id>                        # View run details
gh run view <id> --log                  # View run logs
```

---

## Best Practices Summary

### DO ✅
- Work in feature branches
- Use conventional commit messages
- Write tests first (TDD)
- Keep PRs small and focused
- Test locally before pushing
- Reference issue numbers in PRs
- Verify in production after deploy
- Update issue with verification results
- Clean up branches after merge

### DON'T ❌
- Work directly on main branch
- Skip tests
- Create large PRs with multiple features
- Commit without testing locally
- Merge without review
- Leave stale branches
- Forget to reference issues
- Skip production verification

---

## Troubleshooting

### Branch Issues
```bash
# Branch exists on remote but not local
git fetch origin
git checkout issue-X-desc

# Accidentally committed to main
git checkout -b issue-X-desc
git checkout main
git reset --hard origin/main
```

### Merge Conflicts
```bash
# Update branch with main
git checkout issue-X-desc
git fetch origin
git merge origin/main

# Resolve conflicts in editor
# Then:
git add .
git commit -m "merge: resolve conflicts with main"
git push
```

### Failed Deployment
```bash
# View deployment logs
gh run list --limit 1
gh run view <id> --log

# Common fixes:
# 1. TypeScript errors: fix and push
# 2. Build errors: check dependencies
# 3. Deploy errors: check GitHub Pages settings
```

### PR Issues
```bash
# Update PR after changes
git add .
git commit -m "fix: address review comments"
git push

# Close PR without merging
gh pr close <number>
```

---

## Workflow Variations

### Hotfix Workflow
For critical bugs in production:
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix-critical-bug

# 2. Fix and test
# ... implement fix ...

# 3. Create PR with priority label
gh pr create \
  --title "fix: critical bug causing app crash" \
  --label "priority-high"

# 4. Fast-track review and merge
gh pr merge --squash --delete-branch

# 5. Verify immediately
gh run watch
```

### Feature Flag Workflow
For large features developed over time:
```bash
# 1. Use feature flag in code
const FEATURE_VIDEO = import.meta.env.VITE_FEATURE_VIDEO === 'true';

if (FEATURE_VIDEO) {
  // New feature code
}

# 2. Develop in branch with flag off in production
# 3. Merge incomplete feature (hidden behind flag)
# 4. Enable flag when complete
```

---

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Git Branching Strategies](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**WordGym Students - Git Workflow Guide**
*Last Updated: 2025-12-22*
