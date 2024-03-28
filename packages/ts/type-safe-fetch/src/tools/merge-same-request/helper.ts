export const MERGE_REQUEST_SYMBOL = '__mr'

export const urlDeferredMap: Record<string, DeferredResult[]> = {}

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
