#!/bin/bash
# TypeScript type checking without emitting files
# Part of debugging skill - verifies type correctness

set -e

echo "🔍 Running TypeScript type checking..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ TypeScript: No type errors"
  exit 0
else
  echo "❌ TypeScript: Type errors found"
  exit 1
fi
