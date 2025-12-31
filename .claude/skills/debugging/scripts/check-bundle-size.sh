#!/bin/bash
# Check if bundle exceeds 3MB limit for WordGym Students
# Part of debugging skill - ensures single HTML output is optimized

set -e

# Build silently
echo "🔧 Building..."
npm run build > /dev/null 2>&1

# Check size
SIZE=$(du -m dist/index.html 2>/dev/null | cut -f1)
LIMIT=3

if [ -z "$SIZE" ]; then
  echo "❌ Build failed: dist/index.html not found"
  exit 1
fi

if [ $SIZE -gt $LIMIT ]; then
  echo "❌ Bundle: ${SIZE}MB (limit: ${LIMIT}MB)"
  echo "💡 Analyze: npm run build -- --analyze"
  exit 1
else
  echo "✅ Bundle: ${SIZE}MB (within ${LIMIT}MB limit)"
  exit 0
fi
