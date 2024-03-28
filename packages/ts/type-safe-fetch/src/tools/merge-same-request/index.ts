export type DeferredResult<T = any> = {
	promise: Promise<T>
	resolve: (value: T | PromiseLike<T>) => void
	reject: (reason: any) => void
}

export function Deferred<T = any>(): DeferredResult<T> {
	const result = {
		promise: undefined!,
		resolve: undefined!,
		reject: undefined!,
	} as DeferredResult<T>

	result.promise = new Promise<T>((resolve, reject) => {
		result.resolve = resolve
		result.reject = reject
	})

	return result
}

export function TsFetchToolMergeSameRequest<
	Err extends Error = Error,
	Req extends { _mri_: number } = { _mri_: number },
	Return = Response,
>() {
	const MERGE_REQUEST_SYMBOL = '_mr_'
	const urlDeferredMap: Record<string | number | symbol, DeferredResult<Return>[]> = {}

	return {
		defer(key: string | number | symbol, req: Req) {
			if (urlDeferredMap[key] == null) {
				urlDeferredMap[key] = []
			} else if (Array.isArray(urlDeferredMap[key])) {
				req._mri_ = urlDeferredMap[key].length
				urlDeferredMap[key].push(Deferred())
				throw new Error(MERGE_REQUEST_SYMBOL)
			}
		},

		resolve(key: string | number | symbol, res: any) {
			if (urlDeferredMap[key]?.length) {
				for (let i = 0; i < urlDeferredMap[key].length; i++) {
					urlDeferredMap[key][i].resolve(res || null)
				}
				delete urlDeferredMap[key]
			}
		},

		// return undefined 表示沒有等待中的請求
		async waiting(key: string | number | symbol, req: Req, error: Err) {
			if (error?.message === MERGE_REQUEST_SYMBOL) {
				if (urlDeferredMap[key]?.length) {
					if (urlDeferredMap[key][req._mri_] != null) {
						return await urlDeferredMap[key][req._mri_].promise
					}
				}
			}

			return undefined
		},
	}
}
