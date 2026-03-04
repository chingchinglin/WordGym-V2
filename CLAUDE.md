# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: API 使用禁令

**未經案主明確允許，禁止呼叫任何外部 API。** 這包括但不限於：
- Gemini API（生成測驗選項、例句等）
- OpenAI API
- 任何需要 API Key 的服務

執行任何會呼叫外部 API 的腳本前，必須先向案主說明並取得同意。

## Project Overview

WordGym Students (單字健身坊學生版) — A vocabulary learning web app for Taiwanese junior/senior high school students. Bilingual codebase (comments/UI in Traditional Chinese, code in English).

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compile + Vite build (tsc && vite build)
npm run preview      # Preview production build locally
npm run test         # Run Jest unit tests
npm run test:watch   # Jest in watch mode
npm run test:e2e     # Playwright end-to-end tests
npm run lint         # ESLint for ts/tsx files
npm run deploy       # Build + deploy to GitHub Pages via gh-pages
```

Run a single test file: `npx jest -c jest.config.cjs src/utils/__tests__/multipleChoiceOptions.test.ts`

## Critical Build Constraint: Single HTML Output

Uses `vite-plugin-singlefile` to produce one self-contained `dist/index.html` with all JS/CSS inlined. This file must work when opened via `file://` protocol (double-click) as well as served over HTTP. The `base` in `vite.config.ts` is `/WordGym-V2/`.

## Architecture

### Data Flow

```
Google Sheets CSV → Google Apps Script proxy → CSVDataService (IndexedDB cache, 24h expiry)
                                                      ↓
                                              useDataset hook (hydrates, merges, dedupes)
                                                      ↓
                                              App.tsx passes VocabularyWord[] to pages
```

Fallback: `src/data/vocabulary.json` is bundled as static fallback if CSV fetch fails.

### Routing

Hash-based routing in `App.tsx` via `useHashRoute` hook. Routes: `#/` (home), `#/quiz`, `#/favorites`, `#/word/:id`, `#/quiz-history`, `#/debug`.

### Key Types

`VocabularyWord` (in `src/types/index.ts`) is the central data type — ~50 fields covering English word, Chinese definition, POS tags, example sentences (up to 5), textbook/exam/theme indices, word forms, synonyms/antonyms, affix info, and video URLs.

Words are separated by `stage`: `"junior"` (國中) or `"senior"` (高中). Deduplication uses composite key `${english_word}_${stage}` to prevent cross-stage merging.

### Services

| Service | Purpose |
|---------|---------|
| `CSVDataService` | Fetches vocab from Google Apps Script, caches in IndexedDB |
| `QuizOptionsAPI` | Real-time Gemini API calls for quiz distractor generation |
| `VersionService` | Manages stage/version (龍騰/三民 for 高中, 康軒/翰林/南一 for 國中) |
| `IndexedDBCache` | Generic IndexedDB caching layer |
| `TTSAudioCache` | Text-to-speech audio caching |

### 出題規則

6 種干擾選項類型（每題選 3 種不同）：

| Type | 名稱 | 範例 |
|------|------|------|
| A | 詞形錯誤 | ran → run, runs |
| B | 詞性錯誤 | decision(n.) → decide(v.) |
| C | 語意相反 | increase → decrease |
| D | 拼寫易混淆 | affect → effect |
| E | 發音相似 | their → there |
| F | 搭配錯誤 | make → do a decision |

禁止事項：
1. 禁止不存在的英文單字（childs, runned）
2. 禁止同義詞（填入後語意也通順的不能用）
3. 禁止也正確的答案（uncle 不能當 aunt 的干擾）

### Feature Flags

`src/config/features.ts` — `textbook: true`, `exam: false` (Coming Soon), `theme: true`

### Filtering Architecture

HomePage uses a tab system (textbook/theme/exam) with layered filters:
- `useFilters` + `useTabFilters` — manage filter state per tab
- `useFilteredWordIds` — computes filtered word list
- `TextbookFilters`, `ThemeFilters`, `ExamFilters` — tab-specific filter UIs
- `useQuickFilterPos` — POS quick-filter overlay

### localStorage Keys

All defined in `src/types/index.ts` as `LS` const object. Key namespace: `mvp_vocab_*` and `wordgym_*`.

## Stack

| Layer | Tech |
|-------|------|
| UI | React 18 + TypeScript (strict mode) |
| Build | Vite 5 + vite-plugin-singlefile |
| Styling | Tailwind CSS 3.4 |
| Unit Tests | Jest + ts-jest + jsdom |
| E2E Tests | Playwright |
| Deploy | GitHub Pages (auto on push to main) |

## Deployment

Push to `main` triggers GitHub Actions → builds → deploys to GitHub Pages at `https://youngger9765.github.io/WordGym-students-merge/`. Also creates a GitHub Release with `wordgym-dist.zip`.

## Branch Naming

- `feature/[issue-number]-description`
- `fix/[issue-number]-description`
- `refactor/[issue-number]-description`

## Data Pipeline Scripts

- `scripts/csv_to_json.py` — Converts CSV to `src/data/vocabulary.json` (source-level data cleaning happens here)
- `scripts/generate-quiz-options.mjs` — Batch generates quiz distractors via Gemini API (30s delay between requests)
- `scripts/download-csv-from-google-sheet.mjs` — Downloads CSV from Google Sheets
- `scripts/convert_vocabulary.sh` — Shell wrapper for CSV conversion pipeline
