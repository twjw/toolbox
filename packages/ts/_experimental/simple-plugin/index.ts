// function registerLib <F extends Function, T extends Record<string, Function>>(lib: F, listeners: T): {
//   use: (listeners: T) => any
// } {
//   const listListeners = {} as Record<keyof T, Function[]>
//   appendListener(listeners, listListeners)
//
//   function result () {
//     lib({request: listListeners.request[0]})
//   }
//
//   result.use = (listeners: T) => {}
//
//   return result
// }
//
// function appendListener (fromListeners: Record<string, Function>, toListeners: Record<string, Function[]>) {
//   for (let listenersKey in fromListeners) {
//     if (!toListeners[listenersKey]) toListeners[listenersKey] = [fromListeners[listenersKey]]
//     else toListeners[listenersKey].push(fromListeners[listenersKey])
//   }
// }
//
//
// const lib = registerLib(({ request }) => {
//   request('hello')
// }, {
//   request: (text: string) => {
//     console.log(text)
//   }
// })
//
// lib()


// function create <LC extends string[], F extends Function>(lifecycleList: LC, lib: F) {
// function result () {
//
// }
// result.use = function use(lifecycle: LC[number]) {
//
// }
// return result
// }
//
// const lib = create(['req', 'res'] as const, () => {})
// lib.use('req')


function simplePlugin <LF extends Record<string, Function>, R>(lib: (lfObj: LF) => R) {
  const lfListObj = {} as {
    [K in keyof LF]: LF[K][]
  }

  function _transToLfObj () {
    const lfObj = {} as {
      [K in keyof LF]: LF[K]
    }

    for (let k in lfListObj) {
      lfObj[k] = function (...args) {
        let result
        for (let i = 0; i < lfListObj[k].length; i++) {
          result = lfListObj[k][i](...args)
        }
        return result
      }
    }

    return lfObj
  }

  function result () {
    return lib(_transToLfObj())
  }

  result.middleware = function middleware () {

  }

  result.use = function use <K extends keyof LF>(name: K, impl: LF[K] extends (...args: infer Args) => infer R ? (...args: Args) => R : never): void {
    if (lfListObj[name]) lfListObj[name].push(impl as LF[K])
    else lfListObj[name] = [impl as LF[K]]
  }

  return result
}

const lib = simplePlugin<
  {
    req: (origin: string) => string
  },
  string
>(({ req }) => {
  return req('123')
})

lib.use('req', (origin) => {
  return origin + (Number(origin[origin.length - 1]) + 1)
})

lib.use('req', (origin) => {
  return origin + (Number(origin[origin.length - 1]) + 1)
})

console.log(lib())
