wtbx-type-safe-fetch
===

> 類型安全的 fetch 包，僅為原生 fetch 多包一層類型定義以及攔截器與中間件功能

# 快速開始

```typescript
import { tsFetch } from 'wtbx-type-safe-fetch'

// type is '123'
const result = await tsFetch<'123'>('/api_path')
```

# Api

## tsFetch()

將原生 fetch 的一二餐合併以及 method 的 type 更完善而已 

```typescript
type LuCaseString<S extends string> = S | Uppercase<S>

type TsFetchMethod = LuCaseString<'get' | 'put' | 'post' | 'delete' | 'options'>

type TsFetchRequestInit = Omit<RequestInit, 'method'> & {
  method?: TsFetchMethod
}

type TsFetch = {
  <R = Response>(options: TsFetchRequestInit): Promise<R>
}

// 內部實現僅如此，對於 options 沒有做任何的更動，僅做中間件與攔截器的處理而已
tsFetch('api_path')
// 以上代碼內部運行為:
try {
  // options 會被塞入 url
  interceptor.fori.call.request(options)
  const response = await fetch(options.url, options)
  return interceptor.fori.call.response(response)
} catch (error) {
  return interceptor.fori.call.error(options)
}
```

## new()

重新創建一個 tsFetch 只是創建出來的不再有 new() 方法

## middleware()

將 watch 處理的內容封裝成一個中間件

```typescript
const myMiddleware = {
  request: options => { /*...*/ },
  response: (req, res) => { /*...*/ },
  error: (req, error) => { /*...*/ },
}

// 將掛載 middleware 提供的 watch 方法
tsFetch.middleware(myMiddleware)
```

```typescript
// 補上預設的類型定義
type TsFetchListenerRequestInit = TsFetchRequestInit & { url: string }

type TsFetchRequestInit = Omit<RequestInit, 'method'> & {
  method?: TsFetchMethod
}

type TsFetchMiddleware = <
  Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
  Res = Response,
  Return = Res,
  Err extends Error = Error,
>(
  watchMap: TsFetchWatchMap<Req, Res, Return, Err>,
) => void
```

## watch

提供三種攔截器，分別為(運作時機可以參考上方的 tsFetch() api 文檔)：
- **request** 在 fetch() 前處理
- **response** 在 fetch() 後處理
- **error** 當出錯時才會處理

```typescript
// 後面的 request 攔截器會沿用前面的 options
tsFetch.watch.request((options) => {})

// 後面的 response 攔截器會沿用前面的 response
tsFetch.watch.response((req, res) => {})

// 後面的 response 攔截器會沿用前面的 response
tsFetch.watch.error((req, error) => {})
```

```typescript
// 補上預設的類型定義
// request
type TsFetchRequestListener<Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit> = (
  req: Req,
) => Req | Promise<Req>

// response
type TsFetchResponseListener<
  Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
  Res = Response,
  Return = Res | Promise<Res>,
> = (
  req: Readonly<Req>,
  res: Res,
) => Return

// error
type TsFetchErrorListener<
  Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
  Err extends Error = Error,
  Return = Response | Promise<Response>,
> = (req: Readonly<Req>, error: Err) => Return


// 攔截器用到的類型
type TsFetchListenerRequestInit = TsFetchRequestInit & { url: string }

type TsFetchRequestInit = Omit<RequestInit, 'method'> & {
  method?: TsFetchMethod
}
```

# middlewares

> 先提供兩個，後續再慢慢補充

## method-url 

用來將寫在路徑上的 method 替換成 method 傳入

```typescript
import { tsFetch } from 'wtbx-type-safe-fetch'
import { methodUrl } from 'wtbx-type-safe-fetch/middlewares/method-url'

tsFetch.middleware(methodUrl)

tsFetch(
  {
    url: 'post:/hello/world',
  } 
  /* 
    將被轉換為以下
    {
      url: '/hello/world',
      method: 'post',
    }
   */
)
```

## params-and-body-parser

將傳入的 params 替換成 query-string，傳入的 body 轉換成字串並掛上 content-type application/json，但需要自行安裝 query-string package

### 安裝

```shell
# 內部使用的是 @9 版
$ pnpm add query-string
```

### 使用

```typescript
import { tsFetch } from 'wtbx-type-safe-fetch'
import { paramsAndBodyParser } from 'wtbx-type-safe-fetch/middlewares/params-and-body-parser'

tsFetch.middleware(paramsAndBodyParser)

tsFetch(
  {
    url: '/hello/world',
    method: 'post',
    params: { hello: 'wrold', year: 2024 },
    body: { author: 'twjw' }
  }
  /* 
    將被轉換為以下
    {
      url: '/hello/world?hello=world&year=2024',
      method: 'post',
      body: '{"author":"twjw"}'
      headers: { 'Content-Type': 'application/json' }
    }
   */
)
```

# 最佳實踐

如果只是使用基本的類型定義沒法很完善的處理整個項目的 api 類型，在調用時仍然要自己傳入響應值得泛型，以及每個路徑需要傳遞的參數類型也需要手動傳，對於安全性與方便度是較為低下的，所以項目提供了專門處理這情況的類型定義

## TsFetchTemplate

可以使用內部提供的 TsFetchTemplate 類型來蓋掉預設的 tsFetch() 的類型，這樣就可以以類型來驅動

### 前置

```typescript
const fetch2 = tsFetch as unknown as TsFetchTemplate<{}>
// or 區別在你要改哪個而已，因為要改變原始類型，所以要額外申明變量來接
const fetch2 = tsFetch.new() as unknown as TsFetchTemplate<{}>
```

### 使用

首先劃分目錄來將 api 或服務相關的類型與處理放在一起，我會這麼做：

```text
service
  fetch2 我直接取名 fetch2，不過名字喜好看個人，也可以叫 myFetch ...
    middlewares
      xxx.ts
    api-types
      xxx.ts
    index.ts
```

定義 api 類型

```typescript
// service/api-types/cat.ts
import { TsFetchTemplateDefineApis } from 'wtbx-type-safe-fetch'

// 使用 namespace 包裹對應的 API 類型
export namespace Cat {
  // 裡面的類型可以使用 webstorm plugin 生成
  // 我是使用 Json2ts plugin 來做這件事
  // 安裝後在要生成的地方按下右鍵 > 點擊 Json2ts 來生成
  export type Params = {
    size: string
  }
  
  export type Response = {
    url: string
  }
}

// TsFetchTemplateDefineApis 可以傳入的 key 有
// headers, params, body, response
// 前三者只要有任一必傳，那麼調用時二參必定要傳，可以查看下方的說明
export type Apis = TsFetchTemplateDefineApis<{
  'get:/cat': {
    params: Cat.Params
    response: Cat.Response
  }
}>
  
// service/api-types/dog.ts
import {TsFetchTemplateDefineApis} from "wtbx-type-safe-fetch";

export type Apis = TsFetchTemplateDefineApis<{
  'get:/dog': { response: never }
}>
```

將 tsFetch 的類型蓋掉並導出使用

```typescript
// service/fetch2/index.ts
import { tsFetch, TsFetchTemplate } from 'wtbx-type-safe-fetch'
import { paramsAndBodyParser } from 'wtbx-type-safe-fetch/middlewares/params-and-body-parser'
import { methodUrl } from 'wtbx-type-safe-fetch/middlewares/method-url'
import { type Apis as CatApis } from '@/service/api-types/cat.ts'
import { type Apis as DogApis } from '@/service/api-types/dog.ts'

const fetch2 = tsFetch as unknown as TsFetchTemplate<
  // 將 apis 類型全部引入後合起來傳入到 TsFetchTemplate 泛型參數裡
  CatApis 
  & DogApis
>

// TsFetchTemplate 是以以下兩個中間件驅動的，所以要裝上
fetch2.middleware(methodUrl)
fetch2.middleware(paramsAndBodyParser)

export {
  fetch2,
}


// 使用處(此處可以看出該類型的有用性)
// success，因為沒有要傳的參數，所以不會報錯
fetch2('get:/dog')

// fail，因為 cat 需傳遞 params.size，所以二參必須傳入
fetch2('get:/cat')

// success，有傳入 params.size
fetch2('get:/cat', {
  params: {
    size: 'big',
  },
})

// 補充說明
// fetch2 調用的首參會自動彈出定義的路徑的自動補全下拉窗
// 且不管是 fetch2 調用的首參或是定義處的 key，使用 webstorm 的 shift+f6 重構
// 都能直接將定義處跟所有掉用處的路徑同時重構，這就是該類型的強大之處!!!!
fetch2('get:/dog')
```
