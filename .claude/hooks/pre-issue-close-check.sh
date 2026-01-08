#!/bin/bash
# PreToolUse hook - Block gh issue close without client confirmation
#
# Trigger: PreToolUse(Bash)
# Purpose: Prevent closing issues without client approval
#
# Installation: Configured via .claude/settings.json

set -e

# Read tool input from stdin
TOOL_INPUT=$(cat)

# Extract command from tool input (handles JSON format)
COMMAND=$(echo "$TOOL_INPUT" | grep -oE 'gh issue close [0-9]+' | head -1 || true)

# If not a gh issue close command, allow it
if [ -z "$COMMAND" ]; then
    exit 0
fi

# Extract issue number
ISSUE_NUM=$(echo "$COMMAND" | grep -oE '[0-9]+' | head -1)

if [ -z "$ISSUE_NUM" ]; then
    exit 0
fi

# Define approval keywords (case-insensitive matching)
APPROVAL_KEYWORDS="測試通過|测试通过|可以關閉|可以关闭|沒問題|没问题|LGTM|approved|looks good|works|confirmed|很好|很棒|確認無誤|确认无误"

# Define case owner usernames (add more as needed)
CASE_OWNERS="chingchinglin|linching0319|kaddy-eunice"

# Check for client confirmation in issue comments
COMMENTS=$(gh issue view "$ISSUE_NUM" --json comments --jq '.comments[] | "\(.author.login): \(.body)"' 2>/dev/null || echo "")

# Check if any case owner has posted an approval comment
APPROVAL_FOUND=false

while IFS= read -r comment; do
    # Check if comment is from a case owner
    AUTHOR=$(echo "$comment" | cut -d':' -f1)
    BODY=$(echo "$comment" | cut -d':' -f2-)

    if echo "$AUTHOR" | grep -qiE "$CASE_OWNERS"; then
        if echo "$BODY" | grep -qiE "$APPROVAL_KEYWORDS"; then
            APPROVAL_FOUND=true
            break
        fi
    fi
done <<< "$COMMENTS"

if [ "$APPROVAL_FOUND" = true ]; then
    # Approval found, allow the close
    exit 0
else
    # No approval found, block the close
    echo "🛑 BLOCKED: Cannot close Issue #$ISSUE_NUM"
    echo ""
    echo "❌ 沒有找到案主確認留言"
    echo ""
    echo "📋 Issue 關閉條件："
    echo "   - 案主必須留言「測試通過」、「LGTM」、「沒問題」等確認詞"
    echo "   - AI 的 Chrome 驗證 ≠ 案主確認"
    echo ""
    echo "🔍 已檢查的案主帳號: $CASE_OWNERS"
    echo "🔍 已檢查的確認關鍵字: $APPROVAL_KEYWORDS"
    echo ""
    echo "💡 正確流程："
    echo "   1. 在 Issue 留言說明修復內容"
    echo "   2. 等待案主測試"
    echo "   3. 案主留言確認後，才能關閉"
    echo ""
    echo "📝 如果案主已確認但使用不同帳號，請手動關閉："
    echo "   gh issue close $ISSUE_NUM --comment '案主已在其他管道確認'"
    exit 1
fi
