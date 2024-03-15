import type { TsFetchListenerRequestInit, TsFetchWatchMap } from '../type'

const mock: TsFetchWatchMap<
	Error,
	TsFetchListenerRequestInit & { params?: Record<string, any> },
	any,
	any
> = {
	request(req) {
		const [, filename, method, path] = req.url.match(/^mock:([^:]*):([^:]*):(.+)$/) || []

		if (filename != null) {
			req.url = `${method}:/mock-api${path}`
			req.params = {
				...req.params,
				mockFile: filename,
			}
		}

		return req
	},
}

export { mock }
