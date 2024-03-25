import { TsFetchListenerRequestInit, TsFetchMethod, TsFetchWatchMap } from '../type.ts'

const maxMethodLength = 'options'.length - 1
const minMethodLength = 'get'.length - 1

const methodUrl: TsFetchWatchMap<Error, TsFetchListenerRequestInit, any, any> = {
	request: req => {
		let url = req.url,
			newUrl = ''

		if (url[minMethodLength] === ':') {
			req.method = url.substring(0, minMethodLength) as TsFetchMethod
			newUrl += url.substring(minMethodLength + 1)
		} else {
			for (let i = minMethodLength + 1; i < maxMethodLength + 2; i++) {
				if (url[i] === ':') {
					req.method = url.substring(0, i) as TsFetchMethod
					newUrl += url.substring(i + 1)
					break
				}
			}
		}

		req.url = newUrl || url

		return req
	},
}

export { methodUrl }
