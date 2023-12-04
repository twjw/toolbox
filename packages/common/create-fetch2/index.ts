import queryString from 'query-string'
import { Fetch2 } from './type'
import {InterceptorResponse} from "./type.ts";

const _maxMethodLength = 'DELETE'.length - 1

function _toRequest(prefix: string, config: Fetch2.Config): Fetch2.Request {
  const { url, params, body } = config
  let method: Fetch2.Method = 'get'
  let _url = prefix
  let contentType = 'text/plain'
  let _body: NodeJS.fetch.RequestInit['body']

  for (let i = 0; i < url.length; i++) {
    if (url[i] === ':') {
      method = url.substring(0, i) as Fetch2.Method
      _url += url.substring(i + 1)
      break
    }
    else if (i === _maxMethodLength) {
      _url += url
      break
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

const resolveRes = <R>(res: Fetch2.InterceptorResponse, responseUses: Fetch2.InterceptorUseResponseCallback[], markResolveList: ((result: any) => void)[] | null, resolve: (r: R) => void) => {
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

// TODO retry, 競態, timeout
const createFetch2 = (options?: Fetch2.Options): Fetch2.Instance => {
  const { prefix = '' } = options || {}
  const interceptors = {
    requestUses: [] as Fetch2.InterceptorUseRequestCallback[],
    responseUses: [] as Fetch2.InterceptorUseResponseCallback[],
  }
  const cacheMap = {} as Record<string, { lastCacheTime: number, res: Fetch2.InterceptorResponse }>
  const controllers = {} as Record<symbol, AbortController>
  const repeatMarkMap = {} as Record<symbol | string | number, ((result: any) => void)[]>

  const newFetch = (<R>(url: string, init?: Fetch2.RequestInit, apiOptions?: Fetch2.ApiOptions) => {
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

        const { prefix: apiPrefix, controller: apiController, cacheTime, forceRun, mark } = apiOptions || {}
        const request = _toRequest(apiPrefix || prefix, config)
        const controllerKey = Symbol()
        let res = {} as Fetch2.InterceptorResponse
        let lastCacheTime = 0
        const cacheUrl = `${request.method}:${request.url}`
        let _mark = typeof mark === 'boolean' ? cacheUrl : mark

        if (mark) {
          if (repeatMarkMap[_mark!] != null) {
            repeatMarkMap[_mark!].push((result) => resolve(result))
          } else {
            repeatMarkMap[_mark!] = [(result) => resolve(result)]
          }

          if (repeatMarkMap[_mark!].length > 1) {
            return
          }
        }

        if (cacheMap[cacheUrl] == null) {
          if (cacheTime) {
            lastCacheTime = Date.now() + cacheTime
          }
        } else {
          const c = cacheMap[cacheUrl]
          if (forceRun) {
            delete cacheMap[cacheUrl]
          } else if (c.lastCacheTime < Date.now() + (cacheTime || 0)) {
            delete cacheMap[cacheUrl]
          }
        }

        if (cacheMap[cacheUrl] == null) {
          controllers[controllerKey] = apiController || new AbortController()
          request.signal = controllers[controllerKey].signal

          try {
            let originRes = await fetch(request.url, request)

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
              return 'abort'
            }
          }
          finally {
            delete controllers[controllerKey]
            res.req = request as Fetch2.ResReq
            res.req.origin = {
              url: config.url,
              body: config.body as object,
            }
          }
        } else {
          res = cacheMap[cacheUrl].res
        }

        resolveRes(res, interceptors.responseUses, mark ? repeatMarkMap[_mark!] : null, resolve)

        if (mark && repeatMarkMap[_mark!].length) {
          delete repeatMarkMap[_mark!]
        }
      } catch (err) {
        reject(err)
      }
    })
  }) as Fetch2.Instance

  newFetch.cancel = (controller: AbortController) => {
    controller.abort()
  }

  newFetch.cancelAll = () => {
    const names = Object.getOwnPropertySymbols(controllers)

    for (const name of names) {
      controllers[name]?.abort?.()
      delete controllers[name]
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
  createFetch2,
}
