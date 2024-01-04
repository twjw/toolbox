import { type Connect, type Plugin } from 'vite'
import { IncomingMessage, ServerResponse } from 'node:http'
import path from 'path'
import qs, { type ParsedQuery } from 'query-string'
import body from 'body'
import { PACKAGE_NAME, SL } from '../../../../general/constants'
import { fileURLToPath } from 'url'

type MockApisOptions = {
	dir?: string
}

const PLUGIN_NAME = 'mock-apis'
const FULL_PLUGIN_NAME = `vite-plugin-${PACKAGE_NAME}-${PLUGIN_NAME}`
const CONSOLE_NAME = `[${PACKAGE_NAME}-${PLUGIN_NAME}]`

function _toRelativeFilepath(filepath: string) {
	return `${path
		.relative(path.dirname(fileURLToPath(import.meta.url)), filepath)
		.replace(/[\\\/]/g, '/')}`
}

function _updateFileListener(dir: string, updateTimeMap: Record<string, number>) {
	return (filepath: string) => {
		const [s1, s2] = filepath.split(dir)
		if (!(s1 === '' && s2[0] === SL)) return
		updateTimeMap[_toRelativeFilepath(filepath)] = Date.now()
	}
}

function _useMock(dir: string, updateTimeMap: Record<string, number>) {
	return async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
		if (!req.url) return next()

		try {
			const [url, qsstr] = req.url.split('?')
			let query: ParsedQuery | undefined
			let _body: any

			if (qsstr) {
				query = qs.parse(qsstr)
			}

			_body = await new Promise(resolve => {
				body(req, res, (err, body) => {
					try {
						resolve(JSON.parse(body))
					} catch (error) {
						console.error(`[ERROR]${CONSOLE_NAME} JSON.parse body error`)
						console.error(error)
						resolve(undefined)
					}
				})
			})

			let filepath = _toRelativeFilepath(`${dir}${SL}${query?.mockFile || 'index'}.js`)
			filepath += `?update=${updateTimeMap[filepath] || (updateTimeMap[filepath] = Date.now())}`
			const passData = { query, body: _body }
			const apiMap = (await import(filepath)).default

			if (typeof apiMap[url] !== 'function') throw new Error('mock api 必須是 function!!')

			res.end(JSON.stringify(apiMap[url](passData)))
			return
		} catch (error) {
			console.error(`[ERROR]${CONSOLE_NAME} 解析錯誤`)
			console.error(error)
		}

		next()
	}
}

function mockApis(options?: MockApisOptions): any {
	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		configureServer(server) {
			const { dir = path.resolve(process.cwd(), 'mock-apis') } = options || {}
			const updateTimeMap: Record<string, number> = {} // <檔案路徑, ms>

			console.log(`[LOG]${CONSOLE_NAME} 已開啟 mock-apis 服務`)

			server.middlewares.use('/mock-api', _useMock(dir, updateTimeMap))

			const onUpdateFile = _updateFileListener(dir, updateTimeMap)
			server.watcher.on('add', onUpdateFile)
			server.watcher.on('change', onUpdateFile)
			server.watcher.on('unlink', onUpdateFile)
		},
	}

	return plugin
}

export type { MockApisOptions }

export { mockApis }
