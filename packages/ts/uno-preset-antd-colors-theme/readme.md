wtbx-uno-preset-antd-colors-theme
===

將 @ant-design/colors 顏色寫到 themes 裡，先做最基本的，後續在開參數調整

# 安裝

```shell
$ pnpm add -D wtbx-uno-preset-antd-colors-theme @ant-design/colors
```

# 使用

```typescript
import { defineConfig } from 'unocss'
import { presetAntdColorsTheme } from 'wtbx-uno-preset-antd-colors-theme'

export default defineConfig({
  presets: [
    presetAntdColorsTheme(),
    /*
      變成 theme.colors
      blue = @ant-design/colors.blue.primary
      blue1 = @ant-design/colors.blue[0]
      blue2 = @ant-design/colors.blue[1]
      // ... 以此類推
    */
  ],
})
```
