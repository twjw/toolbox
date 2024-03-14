import { TsFetchListenerRequestInit, TsFetchWatchMap } from '../type'
import qs from 'query-string'

const object = 'object'

const paramsAndBodyParser: TsFetchWatchMap<
	TsFetchListenerRequestInit & { params?: Record<string, any> },
	any,
	any,
	Error
> = {
	request: options => {
		if (options.params != null) {
			options.url += `?${qs.stringify(options.params)}`
		}

		if (options.body != null && typeof options.body === object) {
			if (options.headers == null) options.headers = { 'Content-Type': 'application/json' }
			else if (options.headers instanceof Headers)
				options.headers.set('Content-Type', 'application/json')
			else (options.headers as Record<string, string>)['Content-Type'] = 'application/json'

			options.body = JSON.stringify(options.body)
		}

		return options
	},
}

export { paramsAndBodyParser }
