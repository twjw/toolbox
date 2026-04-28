wtbx-vite-react-i18n
===

簡約的 Vite + React i18n 插件。

- 自動懶加載字典（按需 `import()`）
- 翻譯函數 `t` 可在任意處使用，不限 React 元件
- 支援索引（`{0}`）與具名（`{name}`）兩種傳參模板，並可用 `\{` 跳脫
- 完美的類型推斷（透過 `~i18n` 虛擬模組型別宣告）
- 支援「整合字典」單檔維護多語系，自動拆檔產出各 locale，並支持熱更新

# 安裝

```shell
$ pnpm add -D wtbx-vite-react-i18n
```

> peerDependencies：`react >= 17`、`vite >= 4`

# 配置

## 1. vite.config.ts

```typescript
import { defineConfig } from 'vite'
// 不一定要 swc
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { i18n } from 'wtbx-vite-react-i18n'

export default defineConfig({
  plugins: [
    react(),
    i18n({
      // 字典檔目錄絕對路徑列表，多個目錄時採「後蓋前」（後者目錄中的同名檔覆蓋前者）
      dirs: [path.resolve(process.cwd(), 'src/assets/locales')],
    }),
  ],
})
```

## 2. 建立 `src/shims.i18n.d.ts` 宣告虛擬模組型別

```typescript
declare module '~i18n' {
  import type { I18n } from 'wtbx-vite-react-i18n'
  import type { RecursiveKeyOf } from 'wtbx-types'

  export type Locale = 'zh_TW' | 'en'
  export type Dictionary = typeof import('@/assets/locales/zh_TW.ts').default
  export type KeyofDictionary = RecursiveKeyOf<Dictionary>
  export const dictionary: Dictionary
  export const locale: Locale
  export const t: I18n.Translate<Dictionary>
  export const setLocale: I18n.SetLocale<Locale>
  export const App: I18n.App<Locale>
}
```

## 3. 建立字典檔

字典檔放在 `dirs` 中，**檔名（去副檔名）即為 locale 鍵**，可使用 `.ts` 或 `.json`。

```typescript
// src/assets/locales/zh_TW.ts
const lang = {
  hello: '你好世界',
  come: {
    from: '台灣',
  },
  skills: '技能: {0}{1}, {0}, {name}',
} as const

export default lang
```

```typescript
// src/assets/locales/en.ts
const lang = {
  hello: 'hello world',
  come: {
    from: 'Taiwan',
  },
  skills: 'skill: {0}{1}, {0}, {name}',
} as const

export default lang
```

# 使用

```tsx
import { App as I18nApp, Locale, locale, setLocale, t } from '~i18n'

let current = 0
const langs: Locale[] = ['zh_TW', 'en']

function App() {
  return (
    // 預設語系；字典就緒前顯示 fallback
    <I18nApp defaultLocale={langs[0]} fallback={<div>loading...</div>}>
      <AppContent />
    </I18nApp>
  )
}

function AppContent() {
  function onChangeLocale() {
    setLocale(langs[++current % langs.length])
  }

  return (
    <div>
      <h1>wtbx-vite-react-i18n</h1>
      <h2>t('hello'): {t('hello')}</h2>
      <h2>t('come.from'): {t('come.from')}</h2>
      {/* 支援索引與具名傳參，索引優先 */}
      <h2>t('skills'): {t('skills', ['java', 'script'], { name: 'typescript' })}</h2>
      <button onClick={onChangeLocale}>
        Change locale! (current: {locale})
      </button>
    </div>
  )
}
```

# API

## `i18n(options): Plugin`

Vite 插件工廠函數。

### `options.dirs: string[]` *(required)*

字典檔目錄絕對路徑列表，採後蓋前。多個目錄時，後者目錄中與前者同檔名的字典會整個覆蓋（以檔名為合併單位，不深度合併）。

### `options.uniteFilepath?: string`

整合字典 JSON 路徑。設定後 dev server 會監聽此檔，變動時自動重產 `dirs[last]/<locale>.ts`。詳見「整合字典」章節。

### `options.uniteDictionaries?: UniteDictionaries`

直接以物件方式傳入整合字典（不會被監聽）。

### `options.uniteFileType?: 'ts' | 'json'`

整合字典自動產出的翻譯檔類型，預設 `'json'`。產出 `.ts` 較慢（需經 TS 編譯），若不需要型別推斷可保持 `'json'` 加快啟動。

## 虛擬模組 `~i18n` 匯出

| 名稱 | 型別 | 說明 |
| --- | --- | --- |
| `dictionary` | 當前語系字典 | 切換 locale 後會更新 |
| `locale` | 當前語系字串 | 切換 locale 後會更新 |
| `t` | `(key, idxValList?, keyValMap?) => string` | 翻譯函數 |
| `setLocale` | `(locale, auto?) => Promise<void \| (() => void)>` | 切換語系 |
| `App` | React 元件 | 初始化字典並包裹子樹 |

### `t(key, idxValList?, keyValMap?)`

- `key`：以 `.` 分隔的字典路徑（例：`'come.from'`），找不到時回傳 `key` 原文
- `idxValList?: (string | number)[]`：對應模板中 `{0}`、`{1}`… 的數字佔位符
- `keyValMap?: Record<string, string | number>`：對應模板中 `{name}` 的具名佔位符
- `\{...}`：跳脫，原樣輸出 `{...}`
- 若 `idxValList[idx]` 或 `keyValMap[name]` 為 `null` / `undefined`，會保留原始 `{key}`

### `setLocale(locale, auto = true)`

- 找不到對應字典時 console.warn 並 return
- `auto=true`（預設）：載入字典後立刻觸發 React 重渲染
- `auto=false`：載入字典但**不**觸發更新，回傳一個 `forceUpdate` 函數讓呼叫端自行決定時機（適合在過場動畫後再切換）

### `<App defaultLocale fallback children />`

- `defaultLocale?`：起始語系，未提供時使用 `localeList[0]`
- `fallback?: ReactNode`：字典首次載入完成前顯示
- 內部以一個 `useState` 計數器當 key 包裹子樹，切換 locale 時遞增以重置子樹

# 整合字典（單檔多語系）

當你想在「同一個檔案」中同時維護多語系（例如交給翻譯團隊填表），可使用整合字典：

## JSON 格式

```json
{
  "hello": {
    "英文(en)": "hello world",
    "中文(zh_TW)": "你好世界"
  },
  "skills": {
    "英文(en)": "skill: {0}{1}, {0}, {name}",
    "中文(zh_TW)": "技能: {0}{1}, {0}, {name}"
  }
}
```

- 內層 key 的最後 `(...)` 中內容會被視為 locale（regex `/\(([-_A-z]+)\)$/`），前綴可自由命名作為人類可讀描述
- 沒有 `(locale)` 後綴的內層 key 會被忽略

## 使用方式

```typescript
i18n({
  dirs: [path.resolve(process.cwd(), 'src/assets/locales')],
  uniteFilepath: path.resolve(process.cwd(), '.dictionary.json'),
})
```

或直接傳入物件：

```typescript
i18n({
  dirs: [...],
  uniteDictionaries: { hello: { '英文(en)': 'hello world' } },
})
```

啟動時插件會：

1. 解析整合字典，依 locale 分組
2. 將每個 locale 寫入 `dirs[最後一個]/<locale>.<uniteFileType>`（預設 `.json`；設為 `'ts'` 時產出 `const lang = {...} as const; export default lang`）
3. 後續 `dirs` 掃描就能讀到這些自動產出的字典

`uniteFilepath` 模式下，dev server 會監聽該檔變更，自動重產字典並觸發 HMR full-reload。JSON 語法錯誤時會在終端打印錯誤，但不會中斷服務。

# 運作機制

- 對外名稱 `~i18n`，內部 id `~~i18n.jsx`，由 `resolveId` / `load` hook 處理
- `configResolved` 階段掃描所有 `dirs`，收集 `.ts` / `.json` 為 `{ locale: relativePath }` 映射表
- `load` hook 動態產出 JSX 模組字串，內含懶載入字典 map、`t` / `setLocale` / `App` 等實作
- dev 模式下 `server.watcher` 監聽 `add` / `unlink` 事件（檔名需符合 `[A-z0-9-_]+\.(ts|json)`），250ms debounce 後重建映射並送 `full-reload`

# 注意事項

- 字典檔名（去副檔名）必須與你在 `Locale` 型別中定義的字串一致
- `dirs` 多目錄時是「整檔覆蓋」，不是物件深度合併
- 整合字典 key 沒有 `(locale)` 後綴會被忽略
- 使用 `.ts` 字典時建議加上 `as const`，以獲得最完整的型別推斷
