#!/bin/bash
# PostToolUse hook - Auto format JS/TS files after Edit/Write
# Trigger: PostToolUse(Edit|Write)

set -e

# Read tool use data from stdin
TOOL_DATA=$(cat)

# Extract file path from tool output
FILE_PATH=$(echo "$TOOL_DATA" | grep -oP '(?<=file_path["\s:]+)[^"]+\.(tsx?|jsx?|css)' | head -1 || true)

# Skip if no matching file
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

# Check if prettier/eslint is available
if command -v npx &> /dev/null; then
    # Try to format with prettier
    if [ -f "node_modules/.bin/prettier" ] || npx prettier --version &> /dev/null; then
        npx prettier --write "$FILE_PATH" 2>/dev/null || true
        echo "{\"status\": \"formatted\", \"file\": \"$FILE_PATH\"}"
    fi
fi
