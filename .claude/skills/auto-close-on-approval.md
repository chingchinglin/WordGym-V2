# Auto-Close on Approval Skill

## Purpose
Automatically close GitHub Issues when case owner approves with "測試通過" or similar keywords, triggering cleanup workflow and stopping billing immediately.

## Auto-Activation

Triggers on:
- ✅ "測試通過", "测试通过" (Chinese: tests passed)
- ✅ "可以關閉", "可以关闭" (Chinese: can close)
- ✅ "沒問題", "没问题" (Chinese: no problem)
- ✅ "approved", "LGTM", "looks good", "works" (English)
- ✅ Emoji reactions: ✅, 👍
- ⚠️ **Context**: Only activates when keywords appear in Issue comments by case owner (@chingchinglin or @linching0319 for WordGym project)
- Manual: `/close-issue <issue-number>` (fallback if auto-detection misses)

---

## 🚀 Core Workflow

When approval is detected, execute IMMEDIATELY:

```
Detect Approval Comment
    ↓
Extract Issue Number & PR Number
    ↓
Close Issue (gh issue close)
    ↓
Post Confirmation Comment
    ↓
cleanup-per-issue-on-close.yml Triggered (Automatic)
    ↓
✅ Issue CLOSED
✅ Resources DELETED
✅ Billing STOPPED
```

---

## Step-by-Step Procedure

### Step 1: Detect Approval Comment

Monitor Issue comments for these patterns:

**Chinese Approval Keywords**:
- "測試通過" (tests passed)
- "测试通过" (simplified Chinese)
- "可以關閉" (can close)
- "可以关闭" (simplified Chinese)
- "沒問題" (no problem)
- "没问题" (simplified Chinese)
- "很好" (good)
- "很棒" (great)
- "確認無誤" (confirmed correct)
- "确认无误" (simplified Chinese)

**English Approval Keywords**:
- "approved"
- "LGTM" (Looks Good To Me)
- "looks good"
- "works"
- "working"
- "confirmed"

**Emoji Reactions**:
- ✅ (check mark)
- 👍 (thumbs up)

### Step 2: Verify It's Case Owner

**CRITICAL**: Only auto-close if comment is from case owner:
- WordGym Project: @chingchinglin or @linching0319
- Other projects: Define in project CLAUDE.md

**Check Author**:
```bash
# Get issue comments with author info
gh issue view <NUM> --json comments --jq '.comments[] | {author: .author.login, body: .body}'

# Verify the approving comment is from case owner
```

### Step 3: Extract Issue & PR Numbers

```bash
# From Issue view
ISSUE_NUM=<NUM>

# From PR - need to find which PR is associated with this issue
# Usually the most recent PR mentioning the issue number
ASSOCIATED_PR=$(gh pr list --state closed --search "Related to #${ISSUE_NUM}" --json number --jq '.[0].number')

# Alternative: Get from branch name
BRANCH=$(git branch -r | grep "issue-${ISSUE_NUM}" | head -1 | sed 's|origin/||')
```

### Step 4: Close the Issue

```bash
# Close the issue
gh issue close ${ISSUE_NUM}

# Verify it closed
gh issue view ${ISSUE_NUM} --json state
# Expected: state = "CLOSED"
```

### Step 5: Post Confirmation Comment

```bash
# Get the approval comment author
APPROVER=$(gh issue view ${ISSUE_NUM} --json comments --jq '.comments[-1].author.login')

# Post confirmation
gh issue comment ${ISSUE_NUM} --body "✅ **Issue 已關閉 - 感謝測試確認**

## 完成信息
- ✅ Issue #${ISSUE_NUM} 已關閉
- ✅ PR #${ASSOCIATED_PR} 已合併到 main
- ✅ 功能已部署到生產環境
- ✅ 案主已測試並確認通過
- ✅ 相關資源將自動清理

## 自動化清理
cleanup-per-issue-on-close.yml 工作流已自動觸發：
- 🗑️ 刪除 Cloud Run 服務
- 🗑️ 刪除容器映像
- 🗑️ 刪除功能分支
- 💰 停止計費

---

感謝您的耐心測試和反饋！如有任何問題，歡迎重新開啟 Issue。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Step 6: Verify Cleanup Workflow Triggered

```bash
# Check if cleanup workflow was triggered
gh run list --branch "" --status in_progress --limit 5

# Monitor cleanup progress (should complete within 5-10 minutes)
gh run watch <RUN_ID>

# Verify resources deleted
# Check Cloud Run services deleted
gcloud run services list --region=asia-east1 | grep "preview-issue-${ISSUE_NUM}" || echo "✅ Services deleted"

# Check feature branches deleted
git branch -r | grep "issue-${ISSUE_NUM}" || echo "✅ Branches deleted"
```

---

## Important Rules

### ✅ DO
- Detect and act on approval comments immediately
- Close issue as soon as approval is detected
- Post confirmation comment with relevant links
- Trust that cleanup workflow handles resource deletion
- Work on other issues while cleanup happens

### ❌ DO NOT
- Manually close without approval detection
- Skip confirmation comment
- Assume resources deleted without verification
- Close issues from non-case-owner comments
- Use for unapproved issues

### Fallback (If Auto-Detection Fails)
If auto-detection misses an approval:

```bash
# User can manually trigger with:
# /close-issue 27

# Which executes:
gh issue close 27
gh issue comment 27 --body "[Confirmation comment]"
# Rest happens automatically
```

---

## Integration with git-issue-pr-flow

This skill integrates with git-issue-pr-flow at:

**PDCA Check Phase - Step 7b**:
- After PR merged to main
- Issue stays OPEN with "ready-for-testing" + "needs-testing" labels
- Auto-approval detection monitors for case owner comment
- When approval detected → Auto-close activates
- cleanup-per-issue-on-close.yml automatically triggered

---

## Real-World Example

### Scenario: Issue #27 Fixed and Tested

**Timeline**:
1. **2025-12-31 10:00** - AI merges PR #123 to main, marks issue for testing
2. **2025-12-31 14:30** - Case owner tests and comments "測試通過"
3. **2025-12-31 14:30:05** - Auto-Close Skill detects approval
4. **2025-12-31 14:30:10** - Issue closes with confirmation comment
5. **2025-12-31 14:31** - cleanup-per-issue-on-close.yml triggers
6. **2025-12-31 14:35** - Cloud Run services deleted, billing stopped

**What User Sees**:
- Issue #27 closed
- Confirmation comment posted
- No manual action needed

**What Happens Behind Scenes**:
- cleanup-per-issue-on-close.yml:
  - Extracts issue number 27
  - Deletes duotopia-preview-issue-27-frontend service
  - Deletes duotopia-preview-issue-27-backend service
  - Deletes container images
  - Deletes fix/issue-27-* branches
  - Posts cleanup confirmation
  - Billing stopped immediately

---

## Success Criteria

This skill is successful when:
- ✅ Issues close immediately upon case owner approval
- ✅ Confirmation comment posted with relevant info
- ✅ Cleanup workflow triggers automatically
- ✅ Resources deleted within 5-10 minutes
- ✅ No manual intervention needed
- ✅ Zero billing for deleted resources

---

## Monitoring & Debugging

### Check Recent Auto-Closes
```bash
# See recently closed issues with auto-close comments
gh issue list --state closed --limit 10 --json number,title,closedAt,comments --jq '.[] | select(.comments[] | select(.body | contains("已關閉"))) | {number: .number, title: .title, closed: .closedAt}'
```

### Verify Approval Detection Works
```bash
# Monitor a specific issue for approval
ISSUE_NUM=27
gh issue view ${ISSUE_NUM} --json comments --jq '.comments[-3:] | .[] | {author: .author.login, body: .body[0:100]}'
```

### Debug Failed Auto-Close
If an issue wasn't auto-closed when it should have been:

1. Check if comment is from case owner
2. Check if keywords match the list
3. Check if there's a typo in the keyword
4. Fall back to manual: `/close-issue <NUM>`

---

## Configuration

### Project-Specific Settings

Add to project's CLAUDE.md if different from defaults:

```yaml
AutoCloseSettings:
  case_owners:
    - "chingchinglin"
    - "linching0319"
  approval_keywords_cn:
    - "測試通過"
    - "可以關閉"
    - "沒問題"
  approval_keywords_en:
    - "approved"
    - "LGTM"
    - "looks good"
  emoji_approvals:
    - "✅"
    - "👍"
```

---

## Related Skills

- **git-issue-pr-flow**: Main issue management workflow (this skill integrates with Phase 3)
- **failed-fix-clarification**: Clarify requirements after 2 failed attempts
- **debugging**: Systematic debugging workflow

---

## Version History

**v1.0** (2025-12-31):
- Initial creation
- Automatic detection of approval keywords
- Auto-close on case owner comment
- Integration with cleanup-per-issue-on-close.yml
- Automatic confirmation comment posting

---

**Skill Version**: v1.0
**Last Updated**: 2025-12-31
**Project**: WordGym-students-merge
**Status**: ACTIVE (Effective immediately)
**Trigger**: Auto-activation on approval keywords in Issue comments
