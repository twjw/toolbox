wtbx-vite-antd-locale-import
===

> 通過配置動態產出對應的 dayjs 與 antd date-picker/locale 的語系 import 語法


# 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // 泛型可以傳入 union 來做 key 限制
    antdLocaleImport<string>({
      // 只有一個參數 locales
      locales: {
        // locales 下的每個 key 對應後續方法的唯一參 key
        zh_TW: {
          // 配置 dayjs 取出的 locole 檔名
          dayjs: 'zh-tw',
          // 配置 antd 取出的 locale 檔名
          antd: "zh_TW",
        },
        // 同其他
        en: {
          dayjs: 'en',
          antd: "en_US",
        },
      },
    }),
  ],
})


// vite-env.d.ts
declare module '~import-antd-locales' {
  import type { ImportAntdLocales } from 'wtbx-vite-antd-locale-import'
  // 泛型傳入同 vite.config.ts 的泛型一致，一樣可以用 union 做限制
  export default importAntdLocales = ImportAntdLocales<string>
}
```

# 使用

```typescript
import importAntdLocales from '~import-antd-locales'

export async function updateLocale(locale: string) {
  // importAntdLocales 內部僅對你傳入的 key 去匹配然後 import 對應的語系檔
  // 假設 locale 傳入 zh_TW，那麼會 import 這些 js 檔
  // return Promise.all([
  //     對應配置的 antd
  //     import('antd/es/date-picker/locale/zh_TW'),
  
  //     對應配置的 antd
  //     import('antd/locale/zh_TW'),
  
  //     對應配置的 dayjs
  //     import('dayjs/locale/zh-tw'),
  //   ])
  const [antdDatePickerLocaleModule, antdLocaleModule] = await importAntdLocales(locale)
  // ... do something
}
```
