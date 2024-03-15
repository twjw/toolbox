wtbx-uno-preset-rem
===

將傳入的值轉換成對應的 px 的 rem

# 安裝

```shell
$ pnpm add -D wtbx-uno-preset-rem
```

# 使用

```typescript
import { defineConfig } from 'unocss'
import { presetRem } from 'wtbx-uno-preset-rem'

export default defineConfig({
  presets: [
    presetRem({ 
      baseFontSize: 50 // 要換算的文字尺寸，通常這個會跟 html 的保持一致，預設 16 
    }),
  ],
})

// 以 50 為例，配置完後
// 輸入 w-50 -> width: 1rem    也就是 50 / 50 = 1
// 輸入 h-10 -> height: 0.2rem 也就是 10 / 50 = 0.2
// 這樣就不用 * 4 除以 4 計算了
// 順帶補充，如果想用 calc 的話，可以用 / 4 rem，就會等同直接輸入的 rem：
// 輸入 w-[calc(100% - 12.5rem)] -> width: calc(100% - 1rem)  也就是 12.5 * 4 / 50 = 1
// 輸入 w-[calc(100% - 2.5rem)] -> width: calc(100% - 0.2rem) 也就是 2.5 * 4 / 50 = 0.2
```
