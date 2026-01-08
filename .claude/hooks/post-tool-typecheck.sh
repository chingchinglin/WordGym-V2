#!/bin/bash
# PostToolUse hook - TypeScript type checking after Edit/Write
# Trigger: PostToolUse(Edit|Write)
# Non-blocking: Reports errors but doesn't fail

set -e

# Read tool use data from stdin
TOOL_DATA=$(cat)

# Check if TypeScript file was modified (macOS compatible)
if ! echo "$TOOL_DATA" | grep -q '\.ts'; then
    exit 0
fi

# Run type check (non-blocking)
if [ -f "tsconfig.json" ] && command -v npx &> /dev/null; then
    TYPE_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" 2>/dev/null || echo "0")
    TYPE_ERRORS=$(echo "$TYPE_ERRORS" | tr -d '[:space:]')

    if [ "$TYPE_ERRORS" -gt 0 ] 2>/dev/null; then
        echo "{\"status\": \"type_errors\", \"count\": $TYPE_ERRORS, \"message\": \"Found $TYPE_ERRORS TypeScript error(s). Run 'npm run build' to see details.\"}"
    else
        echo "{\"status\": \"types_ok\", \"message\": \"TypeScript compilation successful\"}"
    fi
fi
