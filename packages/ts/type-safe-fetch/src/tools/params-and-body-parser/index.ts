import { TsFetchListenerRequestInit } from '../../type'
import qs from 'query-string'

export function TsFetchToolParamsAndBodyParser<
	Req extends TsFetchListenerRequestInit & {
		params?: Record<string, any>
	} = TsFetchListenerRequestInit & { params?: Record<string, any> },
>() {
	const object = 'object'

	return {
		transform(req: Req) {
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
		},
	}
}
