import { TsFetchListenerRequestInit, TsFetchMethod, TsFetchWatchMap } from '../type.ts'

const maxMethodLength = 'options'.length - 1
const minMethodLength = 'get'.length - 1

const methodUrl: TsFetchWatchMap<Error, TsFetchListenerRequestInit, any, any> = {
	request: options => {
		let url = options.url,
			newUrl = ''

		if (url[minMethodLength] === ':') {
			options.method = url.substring(0, minMethodLength) as TsFetchMethod
			newUrl += url.substring(minMethodLength + 1)
		} else {
			for (let i = minMethodLength + 1; i < maxMethodLength + 2; i++) {
				if (url[i] === ':') {
					options.method = url.substring(0, i) as TsFetchMethod
					newUrl += url.substring(i + 1)
					break
				}
			}
		}

		options.url = newUrl || url

		return options
	},
}

export { methodUrl }
