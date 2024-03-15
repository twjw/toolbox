import { tsFetch, TsFetchListenerRequestInit, TsFetchTemplate } from 'wtbx-type-safe-fetch'
import { paramsAndBodyParser } from 'wtbx-type-safe-fetch/middlewares/params-and-body-parser.ts'
import { methodUrl } from 'wtbx-type-safe-fetch/middlewares/method-url.ts'
import { Apis as CatApis } from './api-types/cat.ts'
import { Apis as DogApis } from './api-types/dog.ts'

console.clear()

const root = document.getElementById('root')!
root.innerHTML = `
<h1 style="text-align:center;">hello wtbx-type-safe-fetch!</h1>
<div id="fetch-result"></div>
`

const apiPrefix = 'https://api.thecatapi.com'

const fetch2 = tsFetch as unknown as TsFetchTemplate<CatApis & DogApis>

fetch2.middleware(methodUrl)
fetch2.middleware(paramsAndBodyParser)
fetch2.middleware<Error, TsFetchListenerRequestInit, any, any>({
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
	response: (req, res) => res.json(),
	error: (error, req) => {
		console.error(error)
		return req.url
	},
})
;(async () => {
	const resultNode: HTMLElement = root.querySelector('#fetch-result')!
	resultNode.style.display = 'flex'
	resultNode.style.flexDirection = 'column'
	resultNode.style.alignItems = 'center'
	resultNode.style.justifyContent = 'center'

	resultNode.innerHTML = 'fetching ...'

	const res = await fetch2('get:/v1/images/search', {
		params: {
			size: 'med',
			mime_types: 'jpg',
			format: 'json',
			has_breeds: true,
			order: 'RANDOM',
			page: 0,
			limit: 1,
		},
	})

	resultNode.innerHTML = `
    <div>${JSON.stringify(res)}</div>
    <img src="${res[0].url}" style="width:200px;" /> 
  `
})()
