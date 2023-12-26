import type { Plugin } from 'vite'
import jsonBody from 'body/json'
import qs, { type ParsedQuery } from 'query-string'
import path from 'path'
import { log } from '../../../../utils/log.ts'
import { SL } from '../../../../constants'

type MockApisOptions = {
	dir?: string
}

const PLUGIN_NAME = 'mock-apis'
const FULL_PLUGIN_NAME = `vite-plugin-wtbx-${PLUGIN_NAME}`

function mockApis(options?: MockApisOptions): any {
	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		configureServer(server) {
			let { dir = './mock-apis' } = options || {}

			log.info('已開啟 mock-apis 服務')

			server.middlewares.use('/mock-api', async (req, res, next) => {
				if (!req.url) return next()

				try {
					const [url, qsstr] = req.url.split('?')
					let query: ParsedQuery | undefined
					let body: any

					if (qsstr) {
						query = qs.parse(qsstr)
					}
					console.log(query, 111)

					body = await new Promise(resolve => {
						jsonBody(req, res, (err, body) => {
							resolve(body)
						})
					})

					const filepath = `./${path
						.relative(process.cwd(), `${dir}${SL}${query?.mockFile || 'index'}`)
						.replace(/[\\\/]/g, '/')}.js?update=${Date.now()}`
					const passData = { query, body }
					const apiMap = (await import(filepath)).default

					console.log(filepath)

					if (typeof apiMap[url] !== 'function') throw new Error('mock api 必須是 function!!')

					res.end(JSON.stringify(apiMap[url](passData)))
					return
				} catch (error) {
					log.error(`wtbx-mock-apis 解析錯誤`)
					log.error(error)
				}

				next()
			})
		},
	}

	return plugin
}

export type { MockApisOptions }

export { mockApis }
