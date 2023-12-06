import { Fetch2CompeteEnum } from './compete-enum'

module Fetch2 {
	export type Options = {
		// 路由前綴
		prefix?: string
		// 就timeout(毫秒)
		timeout?: number
		// 重複次數 TODO
		retry?: number
		// 競態 TODO
		compete?: Fetch2CompeteEnum
	}

	export type ApiOptions = Options & {
		// 取消控制器
		controller?: AbortController
		// 緩存時間(毫秒)
		cacheTime?: number
		// 是否無視緩存強制執行(會清除緩存)
		forceRun?: boolean
		// 用於處理重複請求的標記，如果路徑相同且標記一致只會發起一次請求
		mark?: Mark
	}

	export type Mark = symbol | string | number | boolean

	export type Method = 'get' | 'post' | 'put' | 'delete'

	export type RequestInit = Omit<NodeJS.fetch.RequestInit, 'body'> & {
		body?: object
		params?: object
		resType?: ResType
	}

	export type ResetStatusMap = {
		timoutInstance?: NodeJS.Timeout

		mark?: symbol | string | number
		repeatMarkMap: Fetch2.RepeatMarkMap

		controllerKey?: symbol
		controllerMap: Fetch2.ControllerMap
	}

	export type ResType = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

	export type CacheMap = Record<string, { lastCacheTime: number; res: InterceptorResponse }>

	export type RepeatMarkMap = Record<symbol | string | number, ((result: any) => void)[]>

	export type ControllerMap = Record<symbol, AbortController>

	export type InterceptorUseRequestCallback = (res: Config) => Config

	export type InterceptorUseRequest = (callback: InterceptorUseRequestCallback) => void

	export type InterceptorUseResponseCallback = (res: InterceptorResponse) => any

	export type InterceptorUseResponse = (callback: InterceptorUseResponseCallback) => void

	export type InterceptorResponse = Omit<Response, 'body' | 'headers'> & {
		data?: any
		config?: ResReq
	}

	export type Config = Fetch2.RequestInit & {
		url: string
	}

	export type Request = Omit<Config, 'body'> & { body: NodeJS.fetch.RequestInit['body'] }

	export type ResReq = Request & {
		origin: {
			url: string
			body: object
		}
	}

	export type Instance = {
		<R = Fetch2.InterceptorResponse>(
			url: string,
			init?: Fetch2.RequestInit,
			options?: ApiOptions,
		): Promise<R>
		cancel: (controller: AbortController) => void
		cancelAll: () => void
		interceptors: {
			request: { use: InterceptorUseRequest }
			response: { use: InterceptorUseResponse }
		}
	}
}

export type { Fetch2 }
