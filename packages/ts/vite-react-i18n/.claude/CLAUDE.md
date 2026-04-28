# wtbx-vite-react-i18n

簡約的 Vite + React i18n 插件。透過 Vite 虛擬模組 `~i18n` 對外提供翻譯函數 `t`、語系切換 `setLocale`、語系狀態 `locale`、字典 `dictionary`，以及包裹應用的 `App` 元件。

## 對外 API

由 `src/index.ts` re-export：
- `i18n(options: I18nOptions): Plugin` — Vite 插件工廠
- 型別：`I18nOptions`、`UniteDictionaries`
- 命名空間 `I18n`：`Translate<Dictionary>`、`SetLocale<Locale>`、`App<Locale>`（給消費端做 `declare module '~i18n'` 用）

## Options（I18nOptions）

- `dirs: string[]` — 字典檔目錄絕對路徑列表，**後蓋前**（後面的目錄覆蓋前面的同名檔）
- `uniteFilepath?: string` — 整合字典 JSON 路徑，會被 dev server 監聽，變動時自動重產各語系檔
- `uniteDictionaries?: UniteDictionaries` — 直接傳入整合字典物件（不監聽）
- `uniteFileType?: 'ts' | 'json'` — 整合字典產出的翻譯檔副檔名，預設 `'json'`（`'ts'` 較慢但有型別推斷）

整合字典格式 `{ key: { "可選描述(locale)": "翻譯文字" } }`，透過 regex `/\(([-_A-z]+)\)$/` 從鍵尾擷取 locale。

## 虛擬模組

- 對外名稱：`~i18n`
- 內部 id：`~~i18n.jsx`（`resolveId` 將 `~i18n` 映射到此 id；`load` 在此 id 上產出模組）
- 模組內容由 `_generateStringModule` 動態組字串生成

模組匯出：
- `_dictionaryMap`（內部）— `{ [locale]: () => import('relative/path') }` 懶載入；首次取用後會被替換為 default export 物件
- `localeList`、`locale`、`dictionary`
- `t(key, idxValList?, keyValMap?)`
- `setLocale(locale, auto = true)`
- `App({ defaultLocale, fallback, children })`

### t 的解析規則
1. `_recurFindKeyValue` 以 `.` 分隔遞迴讀取 `dictionary[a.b.c]`；找不到回傳 `key` 原文
2. `_parseValue` 解析占位符：
   - `{0}`、`{1}` …（純數字）→ 從 `idxValList` 取值
   - `{name}` → 從 `keyValMap` 取值
   - `\{name}` → 跳脫，輸出原文 `{name}`
   - 對應值為 `null` / `undefined` 時保留 `{key}`

### setLocale
- 若 `_dictionaryMap[locale]` 不存在 → console.warn `not found locale ${locale}`
- 否則 await 載入該語系字典，更新 `dictionary` 與 `locale`
- `auto=true`（預設）直接呼叫 `_forceUpdate` 觸發 React 重渲染
- `auto=false` 不觸發更新，回傳 `_forceUpdate` 讓呼叫端自行決定時機

### App 元件
- 初始 `useState(0)`，`_forceUpdate = () => update(i => i + 1)`
- `useEffect` 內初始化 locale：使用 `defaultLocale` 或 `localeList[0]`，找不到字典則 warn
- 首次渲染（`i === 0`）顯示 `fallback || <></>`，字典就緒後切到 `<Fragment key={i}>{children}</Fragment>`，後續切換 locale 透過遞增 `i` 重置子樹

## 插件生命週期（src/plugin.ts）

- `name: 'vite-plugin-@wtbx/vite-react-i18n'`、`enforce: 'pre'`

### configResolved
1. `resultUnitDictionaries` — 若有 `uniteDictionaries` 直接用；否則若有 `uniteFilepath` 讀檔解析 JSON
2. 若整合字典存在 → `generateLocalesByUniteDictionaries`：依 `(locale)` 後綴分組，把每個 locale 寫入 `dirs[last]/<locale>.<uniteFileType>`；`'json'`（預設）寫純 JSON、`'ts'` 寫 `const lang = {...} as const; export default lang`
3. `_generateLangGlobPath` 掃描所有 `dirs`，收集 `.ts` / `.json` 檔，以**檔名（去副檔名）為 locale 鍵**建立 globMap `{ locale: './<relativePath>' }`
4. console log 已開啟多語系功能

### configureServer
- `server.watcher` 監聽 `add` / `unlink` 事件 → debounce（250ms 鎖）重建 globMap → `moduleHotUpdate`
  - 過濾條件：檔名需符合 `/^\\[A-z0-9-_]+\.(ts|json)$/`，且檔案路徑包含某個 `dirs[i]`
- 若有 `uniteFilepath`，`watcher.add(uniteFilepath)` 並監聽 `change`：重新解析 JSON、`generateLocalesByUniteDictionaries` 重產各語系檔、HMR；JSON 解析失敗 console.error 不中斷
- HMR 機制：`moduleGraph.invalidateModule(V_MODULE_ID)` + `server.hot.send({ type: 'full-reload' })` 全頁重整

### resolveId / load
- `resolveId('~i18n')` → 回傳 `~~i18n.jsx`
- `load('~~i18n.jsx')` → globMap 為空時回傳 undefined（讓 Vite 不處理）；否則呼叫 `_generateStringModule` 產出 JSX 字串

## 內部關鍵函式

- `_generateLangGlobPath` — 掃 dirs 後蓋前合併同名檔；用 `path.relative(process.cwd(), filepath)` 產生相對路徑、反斜線轉斜線；錯誤時 `process.exit(0)`
- `_generateStringModule` — 拼接 JSX 模組字串。注意內部所有 `${}` 與反斜線都需正確跳脫（regex 在內層字串中要寫 `\\d+`、`\\\\` 等）
- `resultUnitDictionaries` — 解析整合字典來源（物件優先於檔案）
- `generateLocalesByUniteDictionaries` — 將整合字典依 `(locale)` 後綴拆檔到 `dirs[last]`，第三參數 `fileType` 控制副檔名（`'ts' | 'json'`，預設 `'json'`）
- `moduleHotUpdate` — 觸發虛擬模組失效並 full-reload
- `waitMs` — `setTimeout` Promise 包裝，用於 watcher debounce

## 維護注意事項

- 字典檔必須為 `.ts` 或 `.json`，**檔名即 locale 鍵**
- 整合字典 key 沒有 `(locale)` 後綴會被忽略
- `dirs` 後蓋前邏輯只看「檔名」相同，不是內容合併
- 修改 `_generateStringModule` 時，由於是字串化 JSX，所有反斜線、`${}`、引號需手動跳脫
- locale 名稱限制：整合字典 regex `[-_A-z]+`；watcher 過濾檔名 `[A-z0-9-_]+`
