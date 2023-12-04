module Fetch2 {
  export type Options = {
    // 路由前綴
    prefix?: string
  }

  export type ApiOptions = Options & {
    // 取消控制器
    controller?: AbortController
    // 緩存時間(毫秒)
    cacheTime?: number
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

  export type InterceptorUseResponseCallback = (res: InterceptorResponse) => any

  export type InterceptorUseResponse = (callback: InterceptorUseResponseCallback) => void

  export type InterceptorResponse = Omit<Response, 'body' | 'headers'> & { data: any, req: ResReq }

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
    <R = Fetch2.InterceptorResponse>(url: string, init?: Fetch2.RequestInit, options?: ApiOptions): Promise<R>
    cancel: (controller: AbortController) => void
    cancelAll: () => void
    interceptors: {
      request: { use: InterceptorUseRequest }
      response: { use: InterceptorUseResponse }
    }
  }
}

export type {
  Fetch2,
}
