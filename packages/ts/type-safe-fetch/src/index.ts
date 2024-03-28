import {
	TsFetchBase,
	TsFetchErrorListener,
	TsFetchListenerRequestInit,
	TsFetchNew,
	TsFetchRequestInit,
	TsFetchRequestListener,
	TsFetchResponseListener,
} from './type.ts'

export type * from './type.ts'

const newTsFetch: TsFetchNew = () => {
	const reqListeners: TsFetchRequestListener<any>[] = []
	const resListeners: TsFetchResponseListener<any, any, any>[] = []
	const errListeners: TsFetchErrorListener<any, any, any>[] = []

	function watchRequest<Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit>(
		listener: TsFetchRequestListener<Req>,
	) {
		reqListeners.push(listener)
	}

	function watchResponse<
		Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
		Res = Response,
		Return = Res | Promise<Res>,
	>(listener: TsFetchResponseListener<Req, Res, Return>) {
		resListeners.push(listener)
	}

	function watchError<
		Err extends Error = Error,
		Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
		Return = Response | Promise<Response>,
	>(listener: TsFetchErrorListener<Err, Req, Return>) {
		errListeners.push(listener)
	}

	async function tsFetch<R = Response>(
		url: string,
		requestInit?: TsFetchRequestInit,
	): Promise<R> {
		let lastRequestInit = (requestInit || {}) as TsFetchListenerRequestInit
		lastRequestInit.url = url

		try {
			for (let i = 0; i < reqListeners.length; i++) {
				let nextRequestInit = reqListeners[i](lastRequestInit)
				if (nextRequestInit instanceof Promise) nextRequestInit = await nextRequestInit
				lastRequestInit = nextRequestInit as TsFetchListenerRequestInit
			}

			let lastResponse = await fetch(lastRequestInit.url, lastRequestInit)
			for (let i = 0; i < resListeners.length; i++) {
				let nextResponse = resListeners[i](lastRequestInit, lastResponse)
				if (nextResponse instanceof Promise) nextResponse = await nextResponse
				lastResponse = nextResponse as Response
			}

			return lastResponse as R
		} catch (error) {
			if (!errListeners.length) throw error

			let prevErrorReturn = undefined as R | undefined

			for (let i = 0; i < errListeners.length; i++) {
				let nextErrorReturn = errListeners[i](error as Error, lastRequestInit, prevErrorReturn)
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

	return tsFetch
}

const tsFetch = newTsFetch() as TsFetchBase
tsFetch.new = newTsFetch

export { tsFetch }
