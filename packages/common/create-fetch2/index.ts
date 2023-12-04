import queryString from 'query-string'

module Fetch2 {
  // (input: NodeJS.fetch.RequestInfo, init?: RequestInit): Promise<Response>

  export type Options = {
    prefix?: string
  }

  export type Method = 'get' | 'post' | 'put' | 'delete'

  export type Url<S extends string> = S extends `${infer M}:${infer U
  }`
    ? M extends 'get'
      ? string
      : M extends 'post'
        ? string
        : M extends 'put'
          ? string
          : M extends 'delete'
            ? string
            : never
    : never

  export type RequestInit = NodeJS.fetch.RequestInit & {
    body?: object
    params?: object
    resType?: ResType
  }

  export type ResType = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

  export type InterceptorUseCallback = <R>(res: Response) => R

  export type InterceptorUse = (callback: InterceptorUseCallback) => void

  export type Instance = {
    <R>(url: string, init?: Fetch2.RequestInit): Promise<R>
    interceptors: {
      request: { use: InterceptorUse }
      response: { use: InterceptorUse }
    }
  }
}

const _maxMethodLength = 'DELETE'.length - 1

function _getRequest(prefix: string, url: string, params?: object, body?: object) {
  let method: Fetch2.Method = 'get'
  let _url = prefix
  let contentType = 'text/plain'
  let _body: string | FormData | undefined

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
        _body = JSON.stringify(body)
      } catch (err) {
        console.error(`${_url} body json stringify 失敗`, err)
        _body = `數據非JSON，請檢查: ${String(body)}`
      }
    }
  }

  return {
    method,
    url: _url,
    body: _body,
    contentType,
  }
}

const createFetch2 = (options?: Fetch2.Options): Fetch2.Instance => {
  const { prefix = '' } = options || {}
  const interceptors = {
    requestUses: [] as Fetch2.InterceptorUseCallback[],
    responseUses: [] as Fetch2.InterceptorUseCallback[],
  }

  const newFetch = (async <R>(url: string, init?: Fetch2.RequestInit) => {
    const { method, url: _url, contentType, body } = _getRequest(prefix, url, init?.params, init?.body)
    const headers: Record<string, any> = {
      'content-type': contentType,
    }

    try {
      const res= await fetch(_url, {
        ...init,
        method,
        headers,
        body,
      })

      return res[init?.resType || 'json']() as R
    } catch (e) {

      return undefined as R
    }
  }) as Fetch2.Instance

  const useRequest: Fetch2.InterceptorUse = (callback) => {
    interceptors.requestUses.push(callback)
  }

  const useResponse: Fetch2.InterceptorUse = (callback) => {
    interceptors.responseUses.push(callback)
  }

  newFetch.interceptors = {
    request: {
      use: useRequest
    },
    response: {
      use: useResponse
    },
  }

  return newFetch
}

export type {
  Fetch2
}

export {
  createFetch2,
}
