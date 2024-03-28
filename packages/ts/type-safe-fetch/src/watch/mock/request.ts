import { TsFetchListenerRequestInit } from '../../type'

function request(req: TsFetchListenerRequestInit & { params?: Record<string, any> }) {
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
