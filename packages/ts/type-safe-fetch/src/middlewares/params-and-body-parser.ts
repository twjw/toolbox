import { TsFetchListenerRequestInit, TsFetchWatchMap } from '../type.ts'
import qs from 'query-string'

const object = 'object'

const paramsAndBodyParser: TsFetchWatchMap<
	Error,
	TsFetchListenerRequestInit & { params?: Record<string, any> },
	any,
	any
> = {
	request: req => {
		if (req.params != null) {
			req.url += `?${qs.stringify(req.params)}`
		}

		if (req.body != null && typeof req.body === object) {
			if (req.headers == null) req.headers = { 'Content-Type': 'application/json' }
			else if (req.headers instanceof Headers)
				req.headers.set('Content-Type', 'application/json')
			else (req.headers as Record<string, string>)['Content-Type'] = 'application/json'

			req.body = JSON.stringify(req.body)
		}

		return req
	},
}

export { paramsAndBodyParser }
