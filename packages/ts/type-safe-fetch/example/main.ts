import { tsFetch, TsFetchTemplate } from 'wtbx-type-safe-fetch'
import { Apis as CatApis } from './api-types/cat.ts'
import { Apis as DogApis } from './api-types/dog.ts'
import { methodUrlRequest } from '../src/watch/method-url'
import { pathParamsUrlRequest } from '../src/watch/path-params-url'
import { paramsAndBodyParserRequest } from '../src/watch/params-and-body-parser'

console.clear()

const root = document.getElementById('root')!
root.innerHTML = `
<h1 style="text-align:center;">hello wtbx-type-safe-fetch!</h1>
<div id="fetch-result"></div>
`

const apiPrefix = 'https://api.thecatapi.com'

const fetch2 = tsFetch as unknown as TsFetchTemplate<CatApis & DogApis>

fetch2.watch.request(async req => {
	methodUrlRequest(req)
	pathParamsUrlRequest(req)
	paramsAndBodyParserRequest(req)

	console.log('等待開始...')
	await new Promise<void>(resolve => {
		setTimeout(() => {
			resolve()
		}, 1000)
	})
	console.log('等待結束')

	return {
		...req,
		url: `${apiPrefix}${req.url[0] === '/' ? '' : '/'}${req.url}`,
		headers: req.headers
			? {
					'Content-Type': 'application/json',
					...req.headers,
				}
			: {
					'Content-Type': 'application/json',
				},
	}
})

fetch2.watch.response((req, res) => {
	return res.json()
})

fetch2.watch.error((error, req) => {
	console.error(error)
	return req.url
})
;(async () => {
	const resultNode: HTMLElement = root.querySelector('#fetch-result')!
	resultNode.style.display = 'flex'
	resultNode.style.flexDirection = 'column'
	resultNode.style.alignItems = 'center'
	resultNode.style.justifyContent = 'center'

	resultNode.innerHTML = 'fetching ...'

	const res = await fetch2('get:/:version/images/search', {
		pathParams: {
			version: 'v1',
		},
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
