# Auto-Close on Approval - Quick Reference Card

## What's New?

Issues now **auto-close automatically** when case owner comments with approval keywords. **No manual action needed!**

## Approval Keywords That Trigger Auto-Close

| Language | Keywords |
|----------|----------|
| Chinese | 測試通過, 测试通过, 可以關閉, 可以关闭, 沒問題, 没问题, 很好, 很棒, 確認無誤, 确认无误 |
| English | approved, LGTM, looks good, works, working, confirmed |
| Emoji | ✅, 👍 |

## When Does Auto-Close Happen?

```
PR Merged to Main
    ↓
Issue stays OPEN (ready-for-testing label)
    ↓
Case owner tests and comments "測試通過"
    ↓
🤖 AUTOMATIC: Issue auto-closes
🤖 AUTOMATIC: Confirmation comment posted
🤖 AUTOMATIC: cleanup-per-issue-on-close.yml triggers
🤖 AUTOMATIC: Resources deleted, billing stopped
```

## What Auto-Close Does

- ✅ Closes the Issue
- ✅ Posts confirmation comment with relevant links
- ✅ Triggers cleanup workflow automatically
- ✅ Deletes Cloud Run services
- ✅ Deletes container images
- ✅ Deletes feature branches
- ✅ Stops billing immediately

## What NOT to Do

- ❌ Do NOT manually close issues
- ❌ Do NOT wait for special command
- ❌ Do NOT try to prevent auto-close
- ✅ DO let the system auto-close automatically

## If Auto-Close Fails

Fallback command (user can execute):

```bash
/close-issue <ISSUE_NUM>
```

This will:
1. Close the issue
2. Post confirmation comment
3. Trigger cleanup automatically

## File Locations

| File | Purpose |
|------|---------|
| `.claude/agents/git-issue-pr-flow.md` | Main PDCA workflow (updated) |
| `.claude/skills/auto-close-on-approval.md` | Auto-close skill documentation (new) |
| `.claude/config/skill-rules.json` | Keyword configuration (updated) |
| `.claude/CHANGES.md` | Detailed change summary (new) |
| `.claude/IMPLEMENTATION_SUMMARY.md` | Implementation overview (new) |
| `.claude/QUICK_REFERENCE.md` | This quick reference (new) |

## How to Use It

### For Case Owners (Linching)
When testing is complete:
1. Comment "測試通過" on the Issue
2. Done! Issue closes automatically

### For AI/Developers
1. Implement fix (unchanged)
2. Merge PR to main (unchanged)
3. Wait for case owner approval comment
4. System automatically closes issue
5. Cleanup workflow automatically triggers
6. Resources automatically deleted

## Key Features

| Feature | Status |
|---------|--------|
| Auto-detect approval | ✅ Working |
| Auto-close issue | ✅ Working |
| Auto-post confirmation | ✅ Working |
| Auto-trigger cleanup | ✅ Working |
| Chinese keywords | ✅ 10+ keywords |
| English keywords | ✅ 6+ keywords |
| Emoji reactions | ✅ 2 emojis |
| Case owner verification | ✅ Implemented |
| Manual fallback | ✅ Available |

## Example Scenario

### Time: 2025-12-31 14:30

Case owner comments on Issue #27:
> "測試通過，功能正常運作！"

**What happens automatically (within seconds)**:
- ✅ Issue #27 closes
- ✅ Confirmation comment posted with:
  - PR number (#123)
  - Commit links
  - Cleanup status
- ✅ cleanup-per-issue-on-close.yml triggers
- ✅ Cloud Run services deleted
- ✅ Container images deleted
- ✅ Feature branches deleted
- ✅ Billing stopped

**No manual action needed!**

## Configuration

All approval keywords are configured in:
```
.claude/config/skill-rules.json
```

To add new keywords, update the `auto-close-on-approval` skill keywords list.

## Integration with PDCA

| Phase | Status |
|-------|--------|
| Phase 1: Plan | Unchanged |
| Phase 2: Do | Unchanged |
| Phase 3: Check | **Auto-close added** ⭐ |
| Phase 4: Act | Triggered by auto-close |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Issue didn't close | Check if comment is from case owner (@chingchinglin) |
| Keyword not recognized | Use keywords from the table above |
| Cleanup didn't trigger | Check GitHub Actions workflows |
| Still need manual close | Use `/close-issue <NUM>` |

## Monitoring

### Check Recent Auto-Closes
```bash
gh issue list --state closed --limit 10
```

### Monitor Specific Issue
```bash
gh issue view <NUM> --json comments
```

### Check Cleanup Status
```bash
gh run list --branch ""
```

## Documentation

For more detailed information:

- **Full Implementation Guide**: See `.claude/skills/auto-close-on-approval.md`
- **PDCA Workflow Update**: See `.claude/agents/git-issue-pr-flow.md`
- **All Changes**: See `.claude/CHANGES.md`
- **Implementation Details**: See `.claude/IMPLEMENTATION_SUMMARY.md`

## Quick Links

- Skill: `./.claude/skills/auto-close-on-approval.md`
- Agent: `./.claude/agents/git-issue-pr-flow.md`
- Config: `./.claude/config/skill-rules.json`
- Summary: `./.claude/CHANGES.md`

## Status

✅ **ACTIVE** - Effective immediately (2025-12-31)

---

**Remember**: Just comment "測試通過" and let the automation handle the rest!
