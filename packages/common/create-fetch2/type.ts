import { Fetch2CompeteEnum } from './compete-enum'
import { Fetch2AbortError, Fetch2TimeoutError, Fetch2UnknownError } from './error'

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

	export type FetchErrors = Fetch2AbortError | Fetch2TimeoutError | Fetch2UnknownError

	export type RequestInit = Omit<NodeJS.fetch.RequestInit, 'body'> & {
		body?: Record<string, any> | string
		params?: Record<string, any>
		resType?: ResType
		other?: any // 用戶自行決定的資料
	}

	export type ResType = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

	export type CacheMap = Record<string, { lastCacheTime: number; res: InterceptorResponse }>

	export type RepeatMarkMap = Record<
		symbol | string | number,
		[(arg: any) => void, (arg: any) => any][]
	>

	export type ControllerMap = Record<number, AbortController>

	export type InterceptorUseRequestCallback = (config: Config) => Config

	export type InterceptorUseRequest = (callback: InterceptorUseRequestCallback) => void

	export type InterceptorUseResponseCallback<R = any> = (res: InterceptorResponse) => R

	export type InterceptorUseResponse = <R = any>(
		callback: InterceptorUseResponseCallback<R>,
	) => void

	export type InterceptorUseErrorCallback<R = any> = (
		error: FetchErrors,
		userConfig: {
			url: string
			init: RequestInit | null
			apiOptions: ApiOptions | null
		},
	) => R

	export type InterceptorUseError = <R = any>(callback: InterceptorUseErrorCallback<R>) => void

	export type InterceptorResponse = Response & {
		data?: any
		config?: ResReq
	}

	export type Config = RequestInit &
		ApiOptions & {
			url: string
		}

	export type Request = Omit<Config, 'body'> & {
		body: NodeJS.fetch.RequestInit['body']
	}

	export type ResReq = Request & {
		originBody: Record<string, any> | string | undefined
	}

	export type Instance = {
		<R = InterceptorResponse>(url: string, init?: RequestInit, options?: ApiOptions): Promise<R>
		cancel: (controller: AbortController) => void
		cancelAll: () => void
		interceptors: {
			request: { use: InterceptorUseRequest }
			response: { use: InterceptorUseResponse }
			error: { use: InterceptorUseError }
		}
	}
}

export type { Fetch2 }
