# WordGym 單字健身坊 — 學生版

現代化的單字學習平台，使用 React + TypeScript + Vite 構建。

## 技術架構

- **React 18**: 現代化 UI 框架
- **TypeScript**: 型別安全
- **Vite 5**: 快速開發與打包
- **Tailwind CSS**: 實用的樣式框架
- **vite-plugin-singlefile**: 單一 HTML 檔案輸出
- **Hash-based Routing**: 無需後端的路由方案

## 安裝依賴

```bash
npm install
```

## 開發指令

### 啟動開發伺服器
```bash
npm run dev
```

開發伺服器會在 `http://localhost:5173` 啟動

### 打包生產版本
```bash
npm run build
```

打包後的檔案在 `dist/index.html`（單一檔案）

### 預覽打包結果
```bash
npm run preview
```

## 專案結構

```
WordGym-students-merge/
├── src/
│   ├── components/       # React 元件
│   ├── hooks/           # 自訂 Hooks
│   │   └── useHashRoute.ts
│   ├── utils/           # 工具函式
│   │   └── speechUtils.ts
│   ├── types/           # TypeScript 型別定義
│   │   └── vocabulary.ts
│   ├── App.tsx          # 主應用元件
│   ├── main.tsx         # 應用入口
│   └── index.css        # 全域樣式
├── index-new.html       # HTML 入口
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
├── tailwind.config.js   # Tailwind 配置
└── package.json         # 依賴管理
```

## 核心模組說明

### useHashRoute Hook
提供 hash-based 路由功能：
```typescript
const { hash, push } = useHashRoute();
push('#/about'); // 導航到 /about
```

### speechUtils
語音合成工具：
```typescript
import { speak, stopSpeech } from './utils/speechUtils';
speak('Hello World'); // 朗讀文字
stopSpeech(); // 停止朗讀
```

### 型別定義
```typescript
interface VocabularyWord {
  id: string;
  english_word: string;
  chinese_translation?: string;
  kk_phonetic?: string;
  // ...
}
```

## 打包特性

使用 `vite-plugin-singlefile` 將所有資源（JS、CSS、圖片）內嵌到單一 HTML 檔案中，
方便部署和分享。

## 開發注意事項

- 保持元件模組化（每個檔案不超過 300 行）
- 使用 TypeScript 型別定義
- 遵循 React Hooks 最佳實踐
- 使用 Tailwind CSS 工具類別
- 確保響應式設計

## 測試流程

1. 安裝依賴：`npm install`
2. 啟動開發：`npm run dev`
3. 打包專案：`npm run build`
4. 檢查產出：`ls -lh dist/`

## 版本資訊

- Version: 1.0.0
- Last Updated: 2025-12-18
