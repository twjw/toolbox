wtbx-vite-react-i18n
===

簡約的 react i18n plugin  
- 自動懶加載字典
- 翻譯(t)函數可在任意處使用
- 支持多模板處理
- 完美的類型推斷

# 安裝

```shell
$ pnpm add -D wtbx-vite-react-i18n
```

# 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
// 不一定要 swc
import react from '@vitejs/plugin-react-swc'
import { i18n } from 'wtbx-vite-i18n'

export default defineConfig({
  plugins: [
    react(),
    i18n({
      // 指定目錄位置，如果多改採後蓋前的方式覆蓋字典
      dirs: [path.resolve(process.cwd(), 'src/assets/locales')],
    }),
  ],
})


// 接著創建 src/shimd.i18n.d.ts
declare module '~i18n' {
  import type { I18n } from 'wtbx-vite-i18n'
  import type { RecursiveKeyOf } from 'wtbx-types'
  import dictionary from '@/assets/locales/zh_TW.ts'

  export type Locale = 'zh_TW' | 'en'
  export type Dictionary = typeof dictionary
  export type KeyofDictionary = RecursiveKeyOf<Dictionary>
  export const dictionary: Dictionary
  export const locale: Locale
  export const t: I18n.Translate<Dictionary>
  export const setLocale: I18n.SetLocale<Locale>
  export const App: I18n.App<Locale>
}


// 最後創建字典檔，路徑同 plugin 配置，檔名跟 Locale 定義一致即可
// src/assets/locales/zh_TW.ts
const lang = {
  hello: '你好世界',
  come: {
    from: '台灣',
  },
} as const

// src/assets/locales/en.ts
const lang = {
  hello: 'hello world',
  come: {
    from: 'Taiwan',
  },
} as const

export default lang
```

# 使用

```typescript jsx
import { App as I18nApp, Locale, locale, setLocale, t } from '~i18n'

let current = 0
let langs: Locale[] = ['zh_TW', 'en']

function App() {
  return (
    // 預設語系
    <I18nApp defaultLocale={langs[0]}>
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
      <h1>wtbx-vite-i18n</h1>
      {/*這麼做就可以取得翻譯了*/}
      <h2>t('hello'): {t('hello')}</h2>
      <h2>t('come.from'): {t('come.from')}</h2>
      {/*支持數組跟具名傳參*/}
      <h2>t('skills'): {t('skills', ['java', 'script'], { name: 'typescript' })}</h2>
      {/* 使用 setLocale 傳入 locale 就可以更新應用的語系 */}
      <button onClick={onChangeLocale}>
        {/*locale 為當前語系*/}
        Change locale! (current: {locale})
      </button>
    </div>
  )
}
```
