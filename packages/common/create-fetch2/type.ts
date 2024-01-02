import { Fetch2CompeteEnum } from './compete-enum'
import { Fetch2AbortError, Fetch2TimeoutError, Fetch2UnknownError } from './error'

namespace Fetch2 {
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

	export type RequestInit<Url extends string = ''> = Omit<
		NodeJS.fetch.RequestInit,
		'method'
	> & {
		params?: Record<string, any>
		resType?: ResType
		other?: any // 用戶自行決定的資料
	} & PathParams<Url>

	export type PathParams<Url extends string> = UrlPathParams<Url> extends undefined
		? {
				pathParams?: undefined
		  }
		: {
				pathParams: UrlPathParams<Url>
		  }

	export type UrlPathParams<
		Url extends string,
		Params extends string[] = [],
	> = Url extends `${infer B}/:${infer P}/${infer R}`
		? UrlPathParams<R, [...Params, P]>
		: Url extends `${infer B}/:${infer P}`
		  ? Record<[...Params, P][number], string>
		  : undefined

	export type ResType = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

	export type CacheMap = Record<string, { lastCacheTime: number; res: InterceptorResponse }>

	export type RepeatMarkMap = Record<
		symbol | string | number,
		[(arg: any) => void, (arg: any) => any][]
	>

	export type ControllerMap = Record<number, AbortController>

	export type InterceptorUseRequestCallback = (config: Config) => Config

	export type InterceptorUseRequest = (callback: InterceptorUseRequestCallback) => void

	export type InterceptorUseResponseCallback<R1 = any, R2 = any> = (
		res: InterceptorResponse<R1>,
	) => R2

	export type InterceptorUseResponse = <R1 = any, R2 = any>(
		callback: InterceptorUseResponseCallback<R1, R2>,
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

	export type InterceptorResponse<Data = any> = Response & {
		data: Data | undefined
		config: Config & { method: Fetch2.Method }
	}

	export type Config = RequestInit &
		ApiOptions & {
			url: string
		}

	export type InstanceFunc = {
		cancel: (controller: AbortController) => void
		cancelAll: () => void
		interceptors: {
			request: { use: InterceptorUseRequest }
			response: { use: InterceptorUseResponse }
			error: { use: InterceptorUseError }
		}
	}

	export type Instance = {
		<R = InterceptorResponse, Url extends string = ''>(
			url: Url,
			init?: RequestInit<Url>,
			options?: ApiOptions,
		): Promise<R>
	} & InstanceFunc
}

namespace TypeFetch2 {
	export type Api = {
		response: any
		body?: string | FormData | Record<string, any>
		params?: Fetch2.RequestInit['params']
		resType?: Fetch2.RequestInit['resType']
	}

	export type Response<
		Apis extends Record<string, Api>,
		Url extends keyof Apis,
	> = Apis[Url] extends { response: infer Data } ? Data : undefined

	export type InitBody<
		Apis extends Record<string, Api>,
		Url extends keyof Apis,
	> = Apis[Url] extends { body: infer Body } ? { body: Body } : {}

	export type InitParams<
		Apis extends Record<string, Api>,
		Url extends keyof Apis,
	> = Apis[Url] extends { params: infer Params } ? { params: Params } : {}

	export type InitResType<
		Apis extends Record<string, Api>,
		Url extends keyof Apis,
	> = Apis[Url] extends { resType: infer ResType } ? { resType: ResType } : {}

	export type Init<Apis extends Record<string, Api>, Url extends keyof Apis> = Omit<
		Fetch2.RequestInit<Url & string>,
		'body' | 'params' | 'resType'
	> &
		InitBody<Apis, Url> &
		InitParams<Apis, Url> &
		InitResType<Apis, Url>

	export type Options = Omit<Fetch2.ApiOptions, 'controller'>

	export type DefineApis<T extends Record<string, Api>> = T

	export type Instance<Apis extends Record<string, Api>> = Fetch2.InstanceFunc & {
		<Url extends keyof Apis>(
			url: Url,
			init?: Init<Apis, Url>,
			options?: Options,
		): Promise<Response<Apis, Url>>
	}
}

export type { Fetch2, TypeFetch2 }
