import type {
	TsFetchBase,
	TsFetchErrorListener,
	TsFetchNew,
	TsFetchOptions,
	TsFetchRequestListener,
	TsFetchResponseListener,
	TsFetchWatchMap,
} from './type'
export type * from './type'

const newTsFetch: TsFetchNew = () => {
	const reqListeners: TsFetchRequestListener<any>[] = []
	const resListeners: TsFetchResponseListener<any, any>[] = []
	const errListeners: TsFetchErrorListener<any, any, any>[] = []

	function watchRequest<Req extends TsFetchOptions = TsFetchOptions>(
		listener: TsFetchRequestListener<Req>,
	) {
		reqListeners.push(listener)
	}

	function watchResponse<Res = Response, Return = Res | Promise<Res>>(
		listener: TsFetchResponseListener<Res, Return>,
	) {
		resListeners.push(listener)
	}

	function watchError<
		Err extends Error = Error,
		Opt extends TsFetchOptions = TsFetchOptions,
		Return = Response | Promise<Response>,
	>(listener: TsFetchErrorListener<Err, Opt, Return>) {
		errListeners.push(listener)
	}

	function middleware<
		Req extends TsFetchOptions = TsFetchOptions,
		Res = Response,
		Return = Res,
		Err extends Error = Error,
	>(watchMap: TsFetchWatchMap<Req, Res, Return, Err>) {
		if (watchMap.request) reqListeners.push(watchMap.request)
		if (watchMap.response) resListeners.push(watchMap.response)
		if (watchMap.error) errListeners.push(watchMap.error)
	}

	async function tsFetch<R = Response>(options: TsFetchOptions): Promise<R> {
		let lastOptions: TsFetchOptions = options

		try {
			for (let i = 0; i < reqListeners.length; i++) {
				let nextOptions = reqListeners[i](lastOptions)
				if (nextOptions instanceof Promise) nextOptions = await nextOptions
				lastOptions = nextOptions as TsFetchOptions
			}

			let lastResponse = await fetch(lastOptions.url, lastOptions)
			for (let i = 0; i < resListeners.length; i++) {
				let nextResponse = resListeners[i](lastResponse)
				if (nextResponse instanceof Promise) nextResponse = await nextResponse
				lastResponse = nextResponse as Response
			}

			return lastResponse as R
		} catch (error) {
			if (!errListeners.length) throw error

			let prevErrorReturn = undefined as R | undefined

			for (let i = 0; i < errListeners.length; i++) {
				let nextErrorReturn = errListeners[i](error as Error, lastOptions)
				if (nextErrorReturn instanceof Promise) nextErrorReturn = await nextErrorReturn
				prevErrorReturn = nextErrorReturn as R
			}

			return prevErrorReturn as R
		}
	}

	tsFetch.watch = {
		request: watchRequest,
		response: watchResponse,
		error: watchError,
	}
	tsFetch.middleware = middleware

	return tsFetch
}

const tsFetch = newTsFetch() as TsFetchBase
tsFetch.new = newTsFetch

export { tsFetch }
