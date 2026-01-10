# WordGym Students - 單字健身坊學生版

> 通用規則見 `~/.claude/CLAUDE.md`（Agent 路由、Git、Security、TDD）

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript 5.3 |
| Build | Vite 5.0 |
| Styling | Tailwind CSS 3.4 |
| Output | **Single HTML** (vite-plugin-singlefile) |

## Key Feature: Single HTML Build

**CRITICAL**: 使用 `vite-plugin-singlefile` 生成單一 HTML

- All CSS inlined (Tailwind)
- All JavaScript bundled inline
- Output: `dist/index.html` (self-contained)

```bash
npm run build
npm run preview
```

## TypeScript Standards

- Strict mode
- No `any` without justification
- Prefer interfaces over types
- Proper type inference

## React Best Practices

- Functional components + hooks
- Proper dependency arrays
- Avoid inline functions in JSX
- Use React.memo for expensive components

## Commands

```bash
# Development
npm run dev

# Build & Test
npm run build
npm run test
npm run lint
```

## Branch Naming

- `feature/[issue-number]-description`
- `fix/[issue-number]-description`
- `refactor/[issue-number]-description`
