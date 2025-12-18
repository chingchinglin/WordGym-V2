# WordGym Project Structure (After Phase 1 Migration)

## Directory Tree

```
WordGym-students-merge/
├── index.html                          # Original monolithic file (5,542 lines) - TO BE REPLACED
├── index-new.html                      # Backup
├── index-old.html                      # Backup
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── vite.config.ts                      # Vite build config
│
├── PHASE1_MIGRATION_COMPLETE.md        # ✅ Phase 1 summary
├── USAGE_GUIDE.md                      # ✅ Code examples
├── MIGRATION_REPORT.md                 # ✅ Detailed report
├── PROJECT_STRUCTURE.md                # ✅ This file
│
└── src/
    ├── main.tsx                        # Entry point
    ├── App.tsx                         # Main app component (TO BE UPDATED)
    ├── index.css                       # Global styles
    │
    ├── types/                          # ✅ Type Definitions (308 lines)
    │   ├── index.ts                    # Main types (VocabularyWord, Filters, etc.)
    │   └── vocabulary.ts               # Legacy types (TO BE MERGED/REMOVED)
    │
    ├── utils/                          # ✅ Utility Functions (857 lines)
    │   ├── index.ts                    # Barrel export
    │   ├── csvParser.ts                # CSV/TSV parsing (217 lines)
    │   ├── dataProcessing.ts           # Data normalization (232 lines)
    │   ├── wordUtils.ts                # Word display utilities (217 lines)
    │   ├── filterUtils.ts              # Filtering logic (165 lines)
    │   └── speechUtils.ts              # Text-to-speech (26 lines)
    │
    └── hooks/                          # ✅ Custom React Hooks (775 lines)
        ├── index.ts                    # Barrel export
        ├── useHashRoute.ts             # Hash routing (existing)
        ├── useDataset.ts               # Core data management (434 lines)
        ├── useFavorites.ts             # Favorites management (51 lines)
        ├── useUserSettings.ts          # User preferences (46 lines)
        ├── useFilters.ts               # Filter state (123 lines)
        ├── useQuizHistory.ts           # Quiz history (53 lines)
        └── useUserExamples.ts          # User examples (68 lines)
```

---

## File Descriptions

### 📄 Root Files

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Original monolithic app | ⚠️ TO BE REPLACED |
| `index-new.html` | Backup | - |
| `index-old.html` | Backup | - |
| `package.json` | NPM dependencies | ✅ |
| `tsconfig.json` | TypeScript config | ✅ |
| `vite.config.ts` | Build configuration | ✅ |

### 📚 Documentation

| File | Content | Lines |
|------|---------|-------|
| `PHASE1_MIGRATION_COMPLETE.md` | Phase 1 summary | 150+ |
| `USAGE_GUIDE.md` | Code examples & best practices | 350+ |
| `MIGRATION_REPORT.md` | Detailed migration report | 450+ |
| `PROJECT_STRUCTURE.md` | This file | 200+ |

### 🔤 Type Definitions (`src/types/`)

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `index.ts` | Main type definitions | 308 | ✅ COMPLETE |
| `vocabulary.ts` | Legacy types | 38 | ⚠️ TO BE MERGED |

**Key Types**:
- `VocabularyWord` - Main data model (30+ fields)
- `POSType` - Part of speech enum
- `UserSettings` - User preferences
- `Filters` - Filter state (textbook/exam/theme)
- `QuizRecord` - Quiz history
- `UserExample` - User-created examples

### 🛠️ Utilities (`src/utils/`)

| File | Purpose | Lines | Functions | Status |
|------|---------|-------|-----------|--------|
| `csvParser.ts` | CSV/TSV parsing | 217 | 4 | ✅ COMPLETE |
| `dataProcessing.ts` | Data normalization | 232 | 10 | ✅ COMPLETE |
| `wordUtils.ts` | Word display/export | 217 | 5 | ✅ COMPLETE |
| `filterUtils.ts` | Filtering logic | 165 | 2 | ✅ COMPLETE |
| `speechUtils.ts` | Text-to-speech | 26 | 2 | ✅ EXISTING |
| `index.ts` | Barrel export | 7 | - | ✅ COMPLETE |

**Total**: 864 lines, 23+ functions

### 🎣 Hooks (`src/hooks/`)

| File | Purpose | Lines | State | Methods | Status |
|------|---------|-------|-------|---------|--------|
| `useDataset.ts` | Core data management | 434 | `data` | 3 | ✅ COMPLETE |
| `useFavorites.ts` | Favorites | 51 | `favorites` | 2 | ✅ COMPLETE |
| `useUserSettings.ts` | User preferences | 46 | `userSettings` | 2 | ✅ COMPLETE |
| `useFilters.ts` | Filter state | 123 | 3 states | 7 | ✅ COMPLETE |
| `useQuizHistory.ts` | Quiz history | 53 | `history` | 3 | ✅ COMPLETE |
| `useUserExamples.ts` | User examples | 68 | `userExamples` | 3 | ✅ COMPLETE |
| `useHashRoute.ts` | Routing | - | `hash` | 1 | ✅ EXISTING |
| `index.ts` | Barrel export | 9 | - | - | ✅ COMPLETE |

**Total**: 784 lines, 7 hooks, 21+ methods

---

## Component Architecture (To Be Created - Phase 2)

```
src/
└── components/                     # ⏳ PHASE 2
    ├── ui/                         # Basic UI components
    │   ├── Button.tsx
    │   ├── SpeakerButton.tsx
    │   ├── Input.tsx
    │   ├── Select.tsx
    │   └── Card.tsx
    │
    ├── features/                   # Feature components
    │   ├── WordCard/
    │   │   ├── WordCard.tsx
    │   │   ├── WordCardHeader.tsx
    │   │   └── WordCardDetail.tsx
    │   │
    │   ├── WordList/
    │   │   ├── WordList.tsx
    │   │   └── WordListItem.tsx
    │   │
    │   ├── Importer/
    │   │   ├── Importer.tsx
    │   │   └── ImportStats.tsx
    │   │
    │   ├── Filters/
    │   │   ├── TabSelector.tsx
    │   │   ├── TextbookFilter.tsx
    │   │   ├── ExamFilter.tsx
    │   │   ├── ThemeFilter.tsx
    │   │   └── QuickPOSFilter.tsx
    │   │
    │   └── Quiz/
    │       ├── QuizCard.tsx
    │       ├── QuizResult.tsx
    │       └── QuizHistory.tsx
    │
    ├── layout/                     # Layout components
    │   ├── Navigation.tsx
    │   ├── Header.tsx
    │   └── Footer.tsx
    │
    └── pages/                      # Page components
        ├── HomePage.tsx
        ├── WordDetailPage.tsx
        ├── FavoritesPage.tsx
        ├── QuizPage.tsx
        └── QuizHistoryPage.tsx
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  - Initializes all hooks                                    │
│  - Provides context to children                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────────────────────┐
                            │                                 │
                            ▼                                 ▼
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│        useDataset()              │    │      useUserSettings()           │
│  - data: VocabularyWord[]        │    │  - stage: 'junior' | 'senior'   │
│  - importRows()                  │    │  - version: string               │
│  - reset()                       │    └──────────────────────────────────┘
└──────────────────────────────────┘                  │
                │                                     │
                ├─────────────────────────────────────┤
                │                                     │
                ▼                                     ▼
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│         useFilters()             │    │       useFavorites()             │
│  - currentTab                    │    │  - favorites: Set<number>        │
│  - filters                       │    │  - toggleFavorite()              │
│  - quickFilterPos                │    │  - isFavorite()                  │
└──────────────────────────────────┘    └──────────────────────────────────┘
                │                                     │
                │                                     │
                ▼                                     ▼
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│     getFilteredWords()           │    │      useQuizHistory()            │
│  (from filterUtils.ts)           │    │  - history: QuizRecord[]         │
│  - Applies all filters           │    │  - addQuizRecord()               │
│  - Returns filtered array        │    │  - clearHistory()                │
└──────────────────────────────────┘    └──────────────────────────────────┘
                │                                     │
                │                                     │
                ▼                                     ▼
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│      WordList Component          │    │      useUserExamples()           │
│  - Displays filtered words       │    │  - userExamples: {[id]: [...]}  │
│  - Pagination                    │    │  - addExample()                  │
│  - Sorting                       │    │  - deleteExample()               │
└──────────────────────────────────┘    └──────────────────────────────────┘
```

---

## State Management Summary

### Global State (via Hooks)

| State | Hook | Persisted | Purpose |
|-------|------|-----------|---------|
| `data` | `useDataset` | ✅ | Main vocabulary dataset |
| `favorites` | `useFavorites` | ✅ | Favorite word IDs |
| `userSettings` | `useUserSettings` | ✅ | Stage & version |
| `currentTab` | `useFilters` | ✅ | Active filter tab |
| `filters` | `useFilters` | ✅ | Tab-specific filters |
| `quickFilterPos` | `useFilters` | ✅ | Quick POS filter |
| `history` | `useQuizHistory` | ✅ | Quiz records |
| `userExamples` | `useUserExamples` | ✅ | User-created examples |
| `hash` | `useHashRoute` | ❌ | Current route |

**Total**: 9 state variables, 8 persisted to localStorage

### Derived State (Computed)

| Derived | Source | Computation |
|---------|--------|-------------|
| `filteredWords` | `data` + `filters` | `getFilteredWords()` |
| `favoriteWords` | `data` + `favorites` | `data.filter(w => favorites.has(w.id))` |
| `wordCount` | `filteredWords` | `filteredWords.length` |
| `uniqueVolumes` | `data` | `getUniqueFilterValues(data, 'vol')` |
| `uniqueLessons` | `data` | `getUniqueFilterValues(data, 'lesson')` |

---

## Import/Export Flow

### Import Flow
```
CSV/TSV File → parseCSV/parseTSV() → Raw Rows
                                       ↓
                          normalizePOS() + mergeThemes()
                                       ↓
                          ensureWordFormsDetail()
                                       ↓
                          importRows() [Collision Detection]
                                       ↓
                          Update data + localStorage
```

### Export Flow
```
VocabularyWord → wordToMarkdown() → Markdown String
                                       ↓
                          Download/Copy to Clipboard
```

---

## Build Pipeline

```
TypeScript Files (.ts/.tsx)
         ↓
    TSC (Type Check)
         ↓
    Vite (Bundle)
         ↓
    Single HTML (with inline JS/CSS)
         ↓
    Deploy
```

---

## Testing Strategy (Recommended)

### Unit Tests
```
src/utils/__tests__/
├── csvParser.test.ts
├── dataProcessing.test.ts
├── wordUtils.test.ts
└── filterUtils.test.ts
```

### Integration Tests
```
src/hooks/__tests__/
├── useDataset.test.ts
├── useFavorites.test.ts
└── useFilters.test.ts
```

### E2E Tests
```
e2e/
├── import-flow.spec.ts
├── filtering.spec.ts
└── quiz.spec.ts
```

---

## Code Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Total Files** | 16 | ✅ |
| **Total Lines** | ~2,150 | ✅ |
| **Type Coverage** | 100% | ✅ |
| **Utility Functions** | 23+ | ✅ |
| **Custom Hooks** | 7 | ✅ |
| **Components** | 0 (Phase 2) | ⏳ |
| **Test Coverage** | 0% (TBD) | ⏳ |

---

## Next Steps Checklist

### Phase 2: Component Migration (Current)
- [ ] Create UI components (Button, Input, etc.)
- [ ] Create feature components (WordCard, Importer, etc.)
- [ ] Create layout components (Navigation, Header, etc.)
- [ ] Create page components (HomePage, WordDetailPage, etc.)

### Phase 3: Integration
- [ ] Wire up hooks in App.tsx
- [ ] Implement routing
- [ ] Add preset data loading
- [ ] Style with Tailwind CSS
- [ ] Add animations

### Phase 4: Testing & Deployment
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Performance optimization
- [ ] Build to single HTML
- [ ] Deploy

---

**Last Updated**: 2025-12-18
**Phase**: 1 COMPLETE, Starting Phase 2
**Next**: Component Migration
