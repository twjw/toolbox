import { tsFetch, TsFetchOptions } from 'wtbx-type-safe-fetch'

console.clear()

const root = document.getElementById('root')!
root.innerHTML = 'hello wtbx-type-safe-fetch!'

const apiPrefix = 'https://api.thecatapi.com'

// const fetch2 = tsFetch as unknown as TsFetchApis & {
//   (options: TsFetchOptions): Promise<Response>
// }
const fetch2 = tsFetch

fetch2.middleware<TsFetchOptions, any, any, Error>({
	request: async options => {
		console.log('等待開始...')
		await new Promise<void>(resolve => {
			setTimeout(() => {
				resolve()
			}, 1000)
		})
		console.log('等待結束')

		return {
			...options,
			url: `${apiPrefix}${options.url[0] === '/' ? '' : '/'}${options.url}`,
			method: options.method || 'GET',
			headers: options.headers
				? {
						'Content-Type': 'application/json',
						...options.headers,
					}
				: {
						'Content-Type': 'application/json',
					},
		}
	},
	response: res => res.json(),
	error: (error, options) => options.url,
})
;(async () => {
	const res = await fetch2({
		url: '/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1',
		headers: { 'x-api-key': 'DEMO-API-KEY' },
		redirect: 'follow',
	})

	console.log(res)
})()
