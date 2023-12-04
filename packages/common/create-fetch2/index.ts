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

  export type RequestInit = Omit<NodeJS.fetch.RequestInit, 'body'> & {
    body?: object
    params?: object
    resType?: ResType
  }

  export type ResType = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

  export type InterceptorUseRequestCallback = (res: Config) => Config

  export type InterceptorUseRequest = (callback: InterceptorUseRequestCallback) => void

  export type InterceptorUseResponseCallback = (res: InterceptorResponse | { req: ResReq }) => any

  export type InterceptorUseResponse = (callback: InterceptorUseResponseCallback) => void

  export type InterceptorResponse = Response & { data: any, req: ResReq }
  export type InterceptorErrorResponse = { req: ResReq }

  export type Config = Fetch2.RequestInit
    & {
    url: string
  }

  export type Request = Omit<Config, 'body'> & { body: NodeJS.fetch.RequestInit['body'] }

  export type ResReq = Request & { origin: {
      url: string
      body: object
    } }

  export type Instance = {
    <R>(url: string, init?: Fetch2.RequestInit): Promise<R>
    interceptors: {
      request: { use: InterceptorUseRequest }
      response: { use: InterceptorUseResponse }
    }
  }
}

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

const createFetch2 = (options?: Fetch2.Options): Fetch2.Instance => {
  const { prefix = '' } = options || {}
  const interceptors = {
    requestUses: [] as Fetch2.InterceptorUseRequestCallback[],
    responseUses: [] as Fetch2.InterceptorUseResponseCallback[],
  }

  const newFetch = (async <R>(url: string, init?: Fetch2.RequestInit) => {
    let config: Fetch2.Config = {
      ...init,
      url,
    }

    if (interceptors.requestUses.length) {
      for (let i = 0; i < interceptors.requestUses.length; i++) {
        config = interceptors.requestUses[i](config)
      }
    }

    const request = _toRequest(prefix, config)
    let res = {} as Fetch2.InterceptorResponse | Fetch2.InterceptorErrorResponse

    try {
      res = await fetch(request.url, request) as Fetch2.InterceptorResponse
      ;(res as Fetch2.InterceptorResponse).data = await (res as Fetch2.InterceptorResponse)[config?.resType || 'json']()
    } catch (e) {
      res = {} as Fetch2.InterceptorErrorResponse
    } finally {
      res.req = request as Fetch2.ResReq
      res.req.origin = {
        url: config.url,
        body: config.body as object,
      }
    }

    let result: R

    if (interceptors.responseUses.length) {
      for (let i = 0; i < interceptors.responseUses.length; i++) {
        result = interceptors.responseUses[i](res)
      }
    }

    return result!
  }) as Fetch2.Instance

  const useRequest: Fetch2.InterceptorUseRequest = (callback) => {
    interceptors.requestUses.push(callback)
  }

  const useResponse: Fetch2.InterceptorUseResponse = (callback) => {
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
