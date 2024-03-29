import type { Plugin } from 'vite'
import { generate } from './generate'
import { waitMs } from './wait-ms'
import { META_NAME, PAGE_NAME } from './constants'
import { type PageRoutesOptions } from './type'

const PLUGIN_NAME = 'wtbx-vite-react-page-routes'
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`
const V_MODULE_NAME = `~page-routes`
const V_MODULE_ID = `~${V_MODULE_NAME}.jsx`
const CONSOLE_NAME = `[${PLUGIN_NAME}]`

function pageRoutes<Meta extends Record<string, any> = {}>(
	options: PageRoutesOptions<Meta>,
): any {
	const { pages, defaultMeta } = options
	let resultJsx = null as string | null

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		configResolved() {
			resultJsx = generate({ pages, defaultMeta })
			console.log(`[LOG]${CONSOLE_NAME}已開啟目錄路由功能，模塊名稱為 ${V_MODULE_NAME}...`)
		},
		configureServer(server) {
			let isUpdating = false

			async function debounceCreate(filepath: string) {
				let filename = null as string | null

				for (let i = 0; i < pages.length; i++) {
					const [, _filename] = filepath.split(pages[i])
					if (_filename != null) filename = _filename
				}

				if (
					isUpdating ||
					!filename ||
					!new RegExp(`(${PAGE_NAME}|${META_NAME})$`).test(filename)
				)
					return

				isUpdating = true
				resultJsx = generate({ pages, defaultMeta })
				await waitMs(250)
				isUpdating = false

				const mod = server.moduleGraph.getModuleById(V_MODULE_ID)

				if (mod) {
					server.moduleGraph.invalidateModule(mod)
					server.ws.send({
						type: 'full-reload',
					})
				}
			}

			server.watcher.on('unlink', debounceCreate)
			server.watcher.on('add', debounceCreate)
		},
		resolveId(id) {
			if (id === V_MODULE_NAME) {
				return V_MODULE_ID
			}
		},
		load(id) {
			if (id === V_MODULE_ID) {
				if (resultJsx == null) return
				return resultJsx
			}
		},
	}

	return plugin
}

export { pageRoutes }
