import { TsFetchListenerRequestInit } from '../../type'

function request<
	Req extends { url: string; params?: Record<string, any> } = TsFetchListenerRequestInit & {
		params?: Record<string, any>
	},
>(req: Req) {
	const [, filename, method, path] = req.url.match(/^mock:([^:]*):([^:]*):(.+)$/) || []

	if (filename != null) {
		req.url = `${method}:/mock-api${path}`
		req.params = {
			...req.params,
			mockFile: filename,
		}
	}

	return req
}

export { request }
