wtbx
===

> Author: @twjw  
> Repository: https://github.com/twjw/toolbox-js

---

# 目錄

- [目錄](#目錄)
- [common](#common)
  - [common/create-callback-watcher](#commoncreate-callback-watcher)
  - [common/create-uuid](#commoncreate-uuid)
  - [common/enum2](#commonenum2)
  - [common/fetch2](#commonfetch2)
  - [common/logs](#commonlogs)
  - [common/range-loop](#commonrange-loop)
  - [common/recur-find-key-str-value](#commonrecur-find-key-str-value)
  - [common/recur-find-key-value](#commonrecur-find-key-value)
- [react](#react)
- [web](#web)
  - [web/Storage2](#webStorage2)

---

# common

## common/create-callback-watcher

## common/create-uuid

## common/enum2

## common/fetch2

## common/logs

## common/range-loop

## common/recur-find-key-str-value

## common/recur-find-key-value


---

# react

---

# web

## web/Storage2

### api

```typescript
import { 
  Storage2, 
  Storage2TypeEnum, // 這個基本不會用到啦，有需要可以引入 
} from 'wtbx/web'

const storage = new Storage2(
  'twjw', // {string} stroge key 前綴
  {}, // {object} storage 的資料 
  localStorage, // {Storage=localStorage} 要存在哪個 storage
)

// 以下是 new Storage2 二參會用到的
Storage2.string(string, Storage)
Storage2.number(number, Storage)
Storage2.boolean(boolean, Storage)
Storage2.json(any, Storage)

// 就 update/remove 應該知道怎用
storage.update(key, value)
storage.remove(key)

// 查看
storage.state.xxx // xxx 是你的key
```

### basic usage

```typescript
import { Storage2 } from 'wtbx/web'

const storage = new Storage2('test', {
  name: Storage2.string('frank'),
  count: Storage2.number(1),
  isAdult: Storage2.boolean(true, sessionStorage),
  skills: Storage2.json(['js'] as string[]),
  user: Storage2.json({} as { name: string }),
})

console.log(storage.state.name) // 'frank'

storage.update('name', 'jeff')

console.log(storage.state.name) // 'jeff'

// reload page
console.log(storage.state.name) // 'jeff'
```
