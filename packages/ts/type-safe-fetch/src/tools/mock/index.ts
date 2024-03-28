export function TsFetchToolMock<
	Req extends { url: string; params?: Record<string, any> } = {
		url: string
		params?: Record<string, any>
	},
>() {
	return {
		request(req: Req) {
			const [, filename, method, path] = req.url.match(/^mock:([^:]*):([^:]*):(.+)$/) || []

			if (filename != null) {
				req.url = `${method}:/mock-api${path}`
				req.params = {
					...req.params,
					mockFile: filename,
				}
			}
		},
	}
}
