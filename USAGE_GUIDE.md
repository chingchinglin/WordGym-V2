# WordGym TypeScript Migration - Usage Guide

## Quick Start

### Importing Utilities

```typescript
// Import all from index
import {
  parseTSV,
  parseCSV,
  normalizePOS,
  multiSplit,
  getFilteredWords,
  wordToMarkdown
} from '@/utils';

// Or import specific modules
import { parseTSV } from '@/utils/csvParser';
import { normalizePOS } from '@/utils/dataProcessing';
```

### Using Hooks

```typescript
import {
  useDataset,
  useFavorites,
  useUserSettings,
  useFilters,
  useQuizHistory,
  useUserExamples
} from '@/hooks';

function App() {
  // Dataset management
  const { data, importRows, reset } = useDataset();

  // User preferences
  const { userSettings, updateSettings } = useUserSettings();

  // Filtering
  const {
    currentTab,
    setCurrentTab,
    filters,
    updateTextbookFilter,
    quickFilterPos,
    setQuickFilterPos
  } = useFilters();

  // Favorites
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Quiz history
  const { history, addQuizRecord, clearHistory } = useQuizHistory();

  // User examples
  const { userExamples, addExample, deleteExample } = useUserExamples();

  // ... rest of component
}
```

## Common Use Cases

### 1. Import CSV Data

```typescript
import { parseCSV } from '@/utils/csvParser';
import { useDataset } from '@/hooks/useDataset';

function ImportButton() {
  const { importRows } = useDataset();

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);

    const stats = importRows(rows, {
      overrideExamples: true,
      replace: false
    });

    console.log(`Added: ${stats.added}, Merged: ${stats.merged}`);
  };

  return <input type="file" onChange={e => handleFileUpload(e.target.files[0])} />;
}
```

### 2. Filter Words

```typescript
import { getFilteredWords } from '@/utils/filterUtils';
import { useDataset, useUserSettings, useFilters } from '@/hooks';

function WordList() {
  const { data } = useDataset();
  const { userSettings } = useUserSettings();
  const { currentTab, filters, quickFilterPos } = useFilters();

  const filteredWords = getFilteredWords(
    data,
    userSettings,
    currentTab,
    filters,
    quickFilterPos
  );

  return (
    <div>
      {filteredWords.map(word => (
        <div key={word.id}>{word.english_word}</div>
      ))}
    </div>
  );
}
```

### 3. Export Word to Markdown

```typescript
import { wordToMarkdown } from '@/utils/wordUtils';
import type { VocabularyWord } from '@/types';

function ExportButton({ word }: { word: VocabularyWord }) {
  const handleExport = () => {
    const markdown = wordToMarkdown(
      word,
      null, // or specific POS
      {}, // or custom extras
      { pos: true, relations: true, affix: true }
    );

    // Download or copy markdown
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${word.english_word}.md`;
    a.click();
  };

  return <button onClick={handleExport}>Export to Markdown</button>;
}
```

### 4. User Settings Management

```typescript
import { useUserSettings } from '@/hooks/useUserSettings';

function SettingsPanel() {
  const { userSettings, updateSettings } = useUserSettings();

  return (
    <div>
      <select
        value={userSettings.stage}
        onChange={e => updateSettings({ stage: e.target.value as 'junior' | 'senior' })}
      >
        <option value="junior">國中</option>
        <option value="senior">高中</option>
      </select>

      <select
        value={userSettings.version}
        onChange={e => updateSettings({ version: e.target.value })}
      >
        <option value="">選擇版本</option>
        <option value="龍騰">龍騰</option>
        <option value="康軒">康軒</option>
        <option value="翰林">翰林</option>
      </select>
    </div>
  );
}
```

### 5. Favorites Management

```typescript
import { useFavorites } from '@/hooks/useFavorites';
import type { VocabularyWord } from '@/types';

function WordCard({ word }: { word: VocabularyWord }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <div>
      <h3>{word.english_word}</h3>
      <button onClick={() => toggleFavorite(word.id)}>
        {isFavorite(word.id) ? '❤️ Favorited' : '🤍 Add to Favorites'}
      </button>
    </div>
  );
}
```

### 6. Tab-based Filtering

```typescript
import { useFilters } from '@/hooks/useFilters';

function FilterTabs() {
  const {
    currentTab,
    setCurrentTab,
    filters,
    updateTextbookFilter,
    updateExamFilter,
    updateThemeFilter
  } = useFilters();

  return (
    <div>
      {/* Tab Selection */}
      <div>
        <button onClick={() => setCurrentTab('textbook')}>課本</button>
        <button onClick={() => setCurrentTab('exam')}>考試</button>
        <button onClick={() => setCurrentTab('theme')}>主題</button>
      </div>

      {/* Textbook Filters */}
      {currentTab === 'textbook' && (
        <div>
          <select
            value={filters.textbook.vol || ''}
            onChange={e => updateTextbookFilter({ vol: e.target.value })}
          >
            <option value="">All Volumes</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>

          <select
            value={filters.textbook.lesson || ''}
            onChange={e => updateTextbookFilter({ lesson: e.target.value })}
          >
            <option value="">All Lessons</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
          </select>
        </div>
      )}

      {/* Exam Filters */}
      {currentTab === 'exam' && (
        <select
          value={filters.exam.year || ''}
          onChange={e => updateExamFilter({ year: e.target.value })}
        >
          <option value="">所有年份</option>
          <option value="108學測">108學測</option>
          <option value="109學測">109學測</option>
        </select>
      )}

      {/* Theme Filters */}
      {currentTab === 'theme' && (
        <div>
          <select
            value={filters.theme.range || ''}
            onChange={e => updateThemeFilter({ range: e.target.value })}
          >
            <option value="">所有程度</option>
            <option value="1200">1200</option>
            <option value="800">800</option>
          </select>

          <select
            value={filters.theme.theme || ''}
            onChange={e => updateThemeFilter({ theme: e.target.value })}
          >
            <option value="">所有主題</option>
            <option value="family">family</option>
            <option value="climate">climate</option>
          </select>
        </div>
      )}
    </div>
  );
}
```

### 7. Quiz History

```typescript
import { useQuizHistory } from '@/hooks/useQuizHistory';
import type { QuizRecord } from '@/types';

function QuizHistoryPage() {
  const { history, deleteRecord, clearHistory } = useQuizHistory();

  return (
    <div>
      <button onClick={clearHistory}>Clear All History</button>

      {history.map(record => (
        <div key={record.id}>
          <h4>{record.type} - {record.date}</h4>
          <p>Score: {record.correct}/{record.totalQuestions}</p>
          <button onClick={() => deleteRecord(record.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### 8. User Examples

```typescript
import { useUserExamples } from '@/hooks/useUserExamples';

function WordExamples({ wordId }: { wordId: number }) {
  const { getExamples, addExample, deleteExample } = useUserExamples();
  const examples = getExamples(wordId);

  const handleAddExample = () => {
    addExample(wordId, {
      sentence: 'My custom sentence',
      translation: '我的自訂例句'
    });
  };

  return (
    <div>
      <button onClick={handleAddExample}>Add Example</button>

      {examples.map((ex, idx) => (
        <div key={idx}>
          <p>{ex.sentence}</p>
          <p>{ex.translation}</p>
          <small>{new Date(ex.createdAt).toLocaleDateString()}</small>
          <button onClick={() => deleteExample(wordId, idx)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Utility Function Reference

### csvParser.ts

```typescript
// Parse TSV text
const rows = parseTSV(tsvText);

// Parse CSV text
const rows = parseCSV(csvText);

// Load from Google Sheet
const result = await loadFromGoogleSheet({
  name: 'Sheet Name',
  sheetId: 'SHEET_ID',
  gid: 'GID',
  theme: 'climate'
});

// Load all configured sheets
const results = await loadAllGoogleSheets({
  enabled: true,
  sheets: [/* sheet configs */]
});
```

### dataProcessing.ts

```typescript
// Normalize POS tag
const pos = normalizePOS('v.'); // returns 'verb'

// Multi-delimiter split
const items = multiSplit('apple, banana; orange'); // ['apple', 'banana', 'orange']

// Deduplicate array
const unique = dedupeList(['a', 'b', 'a', 'c']); // ['a', 'b', 'c']

// Merge themes
const themes = mergeThemes(['family'], 'climate, weather'); // ['family', 'climate', 'weather']

// Categorize word forms
const forms = categorizeWordForms(['running', 'run fast', 'runner'], 'run');
// { base: ['running'], idiom: ['run fast'], derivation: ['runner'], compound: [] }
```

### wordUtils.ts

```typescript
// Generate example
const example = exampleFor('run', 'verb'); // "I run every day."

// Generate translation
const translation = translationFor('run', 'verb'); // "跑"

// POS labels
const label = posLabelFromArray(['noun', 'verb']); // "名詞、動詞"
```

### filterUtils.ts

```typescript
// Get filtered words
const filtered = getFilteredWords(
  allWords,
  userSettings,
  'textbook',
  { textbook: { vol: 'B1', lesson: 'L1' }, exam: {}, theme: {} },
  'all'
);

// Get unique filter values
const volumes = getUniqueFilterValues(allWords, 'vol', userSettings);
```

## Type Definitions

All types are exported from `@/types`:

```typescript
import type {
  VocabularyWord,
  POSType,
  UserSettings,
  Filters,
  CurrentTab,
  QuizRecord,
  UserExample,
  ImportStats,
  ImportOptions
} from '@/types';
```

## Best Practices

1. **Import from index files**: Use `@/utils` and `@/hooks` for cleaner imports
2. **Type everything**: Leverage TypeScript for safety
3. **Use hooks at component level**: Don't call hooks conditionally
4. **Memoize filtered data**: Use `useMemo` for `getFilteredWords()`
5. **Handle loading states**: Check if data is empty before rendering

## Performance Tips

```typescript
import { useMemo } from 'react';
import { getFilteredWords } from '@/utils';

function WordList() {
  const { data } = useDataset();
  const { userSettings } = useUserSettings();
  const { currentTab, filters, quickFilterPos } = useFilters();

  // Memoize expensive filtering
  const filteredWords = useMemo(
    () => getFilteredWords(data, userSettings, currentTab, filters, quickFilterPos),
    [data, userSettings, currentTab, filters, quickFilterPos]
  );

  return <div>{/* render filteredWords */}</div>;
}
```

---

**Last Updated**: 2025-12-18
