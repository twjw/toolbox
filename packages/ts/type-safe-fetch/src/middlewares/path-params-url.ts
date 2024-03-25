import { TsFetchListenerRequestInit, TsFetchWatchMap } from '../type'

const pathParamsUrl: TsFetchWatchMap<
	Error,
	TsFetchListenerRequestInit & { pathParams?: Record<string, string> },
	any,
	any
> = {
	request: req => {
		if (req.pathParams != null) {
			const urls = req.url.split('/')
			for (let i = 1; i < urls.length; i++) {
				if (urls[i][0] === ':') {
					urls[i] = req.pathParams[urls[i].substring(1)] || urls[i]
				}
			}
			req.url = urls.join('/')
		}

		return req
	},
}

export { pathParamsUrl }
