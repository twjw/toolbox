wtbx-enum
===

> **請使用 2+ 版，1+ 版沒提供文檔，且 api 完全不同😂**

# 使用

```typescript
import { wenum } from 'wtbx-enum'

const eRole = wenum(() => ({
  SUPER: {
    value: '1',
    level: 100,
  },
  USER: {
    value: '2',
    level: 200,
  },
  // as const 為必要，這樣才能推斷正確類型
}) as const)

eRole.getByLabel('USER', 'label') // type 與 value 皆為 'USER'
eRole.getByLabel('USER', 'value') // type 與 value 皆為 '2'
eRole.getByLabel('USER', 'level') // type 與 value 皆為 200
eRole.getByValue('1', 'label')    // type 與 value 皆為 SUPER
eRole.getByValue('1', 'level')    // type 與 value 皆為 100
eRole.getByLevel(200, 'value')    // type 與 value 皆為 2

// 也可以傳入二參更改 label 名稱
const eRole2 = wenum(() => ({
  SUPER: {
    value: '1',
    level: 100,
  },
  USER: {
    value: '2',
    level: 200,
  },
}) as const, 'name')

// 以下 label 都被轉成 name 了
eRole2.getByName('USER', 'name')   // type 與 value 皆為 'USER'
eRole2.getByName('USER', 'value')  // type 與 value 皆為 '2'
eRole2.getByName('USER', 'level')  // type 與 value 皆為 200
eRole2.getByValue('1', 'name')     // type 與 value 皆為 SUPER
eRole2.getByValue('1', 'level')    // type 與 value 皆為 100
eRole2.getByLevel(200, 'value')    // type 與 value 皆為 2
```

# API

```typescript
const eRole = wenum(() => ({
  SUPER: {
    value: '1',
    level: 100,
  },
  USER: {
    value: '2',
    level: 200,
  },
}) as const)

eRole.SUPER              // 原本定義的 key 都可以原封不動的取出
eRole.USER               // 同上
eRole.keys               // ['SUPER', 'USER'] 取出自己定義的 key[]
eRole.getByXXX(val, key) // XXX 為對應的子物件 key
                         // val 為對應 XXX 的子物件值
                         // key 為要取出的匹配的值
```
