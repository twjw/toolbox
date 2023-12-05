import queryString from 'query-string'
import { Fetch2 } from './type'

const _maxMethodTextLength = 'delete'.length - 1
const _minMethodTextLength = 'get'.length - 1

class _Fetch2BaseError extends Error {
  static clone(err: Error) {
    const self = new this()
    self.message = err.message
    self.name = this.name;
    self.stack = err.stack;
    return self
  }
}

class Fetch2AbortError extends _Fetch2BaseError {}

class Fetch2TimeoutError extends _Fetch2BaseError {}

class Fetch2UnknownError extends _Fetch2BaseError {}

function _toRequest(prefix: string, config: Fetch2.Config): Fetch2.Request {
  const { url, params, body } = config
  let method: Fetch2.Method = 'get'
  let _url = prefix
  let contentType = 'text/plain'
  let _body: NodeJS.fetch.RequestInit['body']

  if (url[_minMethodTextLength] === ':') {
    method = url.substring(0, _minMethodTextLength) as Fetch2.Method
    _url += url.substring(_minMethodTextLength + 1)
  } else {
    for (let i = _minMethodTextLength + 1; i < _maxMethodTextLength + 2; i++) {
      if (url[i] === ':') {
        method = url.substring(0, i) as Fetch2.Method
        _url += url.substring(i + 1)
        break
      }
    }

    if (_url.length === prefix.length) {
      _url += url
    }
  }

  if (params != null) {
    _url += `?${queryString.stringify(params)}`
  }

  if ((method === 'post' || method === 'put') && body != null) {
    if (body instanceof FormData) {
      contentType = 'multipart/form-data'
      _body = body
    } else if (typeof body === 'object') {
      contentType = 'application/json'
      try {
        _body = JSON.stringify(body) as NodeJS.fetch.RequestInit['body']
      } catch (err) {
        console.error(`${_url} body json stringify 失敗`, err)
        _body = `數據非JSON，請檢查: ${String(body)}` as NodeJS.fetch.RequestInit['body']
      }
    }
  }

  const headers = {
    'content-type': contentType,
    ...config.headers,
  }

  return {
    ...config,
    method,
    url: _url,
    body: _body,
    headers,
  }
}

const _resolveRes = <R>(res: Fetch2.InterceptorResponse, responseUses: Fetch2.InterceptorUseResponseCallback[], markResolveList: ((result: any) => void)[] | null, resolve: (r: R) => void) => {
  let result = res as R

  if (responseUses.length) {
    for (let i = 0; i < responseUses.length; i++) {
      result = responseUses[i](res)
    }
  }

  resolve(result)

  if (markResolveList != null) {
    for (let i = 1; i < markResolveList.length; i++) {
      markResolveList[i](result)
    }
  }
}

const _resetStatus =
  ({
     timoutInstance,

     mark,
     repeatMarkMap,

     controllerKey,
     controllerMap,
   }: Fetch2.ResetStatusMap) => {
  if (timoutInstance != null) {
    clearTimeout(timoutInstance)
  }

  if (mark != null && repeatMarkMap[mark].length) {
    delete repeatMarkMap[mark]
  }

  if (controllerKey != null && controllerMap[controllerKey] != null) {
    delete controllerMap[controllerKey]
  }
}

// TODO retry, 競態
const createFetch2 = (options?: Fetch2.Options): Fetch2.Instance => {
  const { prefix = '', timeout = 0 } = options || {}
  const interceptors = {
    requestUses: [] as Fetch2.InterceptorUseRequestCallback[],
    responseUses: [] as Fetch2.InterceptorUseResponseCallback[],
  }
  const cacheMap = {} as Fetch2.CacheMap
  const controllerMap = {} as Fetch2.ControllerMap
  const repeatMarkMap = {} as Fetch2.RepeatMarkMap

  const newFetch = (<R>(url: string, init?: Fetch2.RequestInit, apiOptions?: Fetch2.ApiOptions) => {
    const resetMap: Fetch2.ResetStatusMap = {
      controllerMap,
      repeatMarkMap,
    }

    return new Promise<R>(async (resolve, reject) => {
      try {
        let config: Fetch2.Config = {
          ...init,
          url,
        }

        if (interceptors.requestUses.length) {
          for (let i = 0; i < interceptors.requestUses.length; i++) {
            config = interceptors.requestUses[i](config)
          }
        }

        const { prefix: apiPrefix, controller: apiController, cacheTime, forceRun, mark, timeout: apiTimeout } = apiOptions || {}
        const fetchConfig = _toRequest(apiPrefix || prefix, config)
        const controllerKey = Symbol()
        let res = {} as Fetch2.InterceptorResponse
        let lastCacheTime = 0
        const cacheUrl = `${fetchConfig.method}:${fetchConfig.url}`
        let _timeout = apiTimeout || timeout

        resetMap.mark = typeof mark === 'boolean' ? cacheUrl : mark
        resetMap.controllerKey = controllerKey

        if (_timeout > 0) {
          resetMap.timoutInstance = setTimeout(() => {
            throw new Fetch2TimeoutError(`fetch timeout ${_timeout}ms`)
          }, _timeout)
        }

        if (resetMap.mark != null) {
          if (repeatMarkMap[resetMap.mark] != null) {
            repeatMarkMap[resetMap.mark].push((result) => resolve(result))
          } else {
            repeatMarkMap[resetMap.mark] = [(result) => resolve(result)]
          }

          if (repeatMarkMap[resetMap.mark].length > 1) {
            return
          }
        }

        if (cacheMap[cacheUrl] == null) {
          if (cacheTime) {
            lastCacheTime = Date.now() + cacheTime
          }
        } else if (forceRun || cacheMap[cacheUrl].lastCacheTime < Date.now() + (cacheTime || 0)) {
          delete cacheMap[cacheUrl]
        }

        if (cacheMap[cacheUrl] == null) {
          controllerMap[controllerKey] = apiController || new AbortController()
          fetchConfig.signal = controllerMap[controllerKey].signal

          try {
            let originRes = await fetch(fetchConfig.url, fetchConfig)

            res = originRes as unknown as Fetch2.InterceptorResponse

            if (lastCacheTime > 0) {
              cacheMap[cacheUrl] = {
                lastCacheTime,
                res,
              }
            }

            res.data = await res[config?.resType || 'json']()
          }
          catch (e) {
            if ((e as Error).name === 'AbortError') {
              throw new Fetch2AbortError('fetch abort')
            }
          }
          finally {
            res.config = fetchConfig as Fetch2.ResReq
            res.config.origin = {
              url: config.url,
              body: config.body as object,
            }
          }
        } else {
          res = cacheMap[cacheUrl].res
        }

        _resolveRes(res, interceptors.responseUses, resetMap.mark != null ? repeatMarkMap[resetMap.mark] : null, resolve)
        _resetStatus(resetMap)
      } catch (err) {
        _resetStatus(resetMap)

        if (err instanceof Fetch2AbortError || err instanceof Fetch2TimeoutError) {
          reject(err)
        } else if (err instanceof Error) {
          reject(Fetch2UnknownError.clone(err))
        } else {
          reject(err)
        }
      }
    })
  }) as Fetch2.Instance

  newFetch.cancel = (controller: AbortController) => {
    controller.abort()
  }

  newFetch.cancelAll = () => {
    const names = Object.getOwnPropertySymbols(controllerMap)

    for (const name of names) {
      controllerMap[name]?.abort?.()
      delete controllerMap[name]
    }
  }

  newFetch.interceptors = {
    request: {
      use: (callback) => {
        interceptors.requestUses.push(callback)
      }
    },
    response: {
      use: (callback) => {
        interceptors.responseUses.push(callback)
      }
    },
  }

  return newFetch
}

export {
  Fetch2AbortError,
  Fetch2TimeoutError,
  Fetch2UnknownError,
  createFetch2,
}
