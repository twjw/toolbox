import type { Plugin } from 'vite'
import {META_NAME, PAGE_NAME, generate, RunOptions} from "./generate.ts";
import {log} from "../../../../../utils/log.ts";
import {waitMs} from "../../../../common";

type ReactPageRoutesOptions = RunOptions

const PLUGIN_NAME = 'page-routes'
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`
const V_MODULE_NAME = `~${PLUGIN_NAME}`
const V_MODULE_ID = `@@${V_MODULE_NAME}.tsx`

function reactPageRoutes(options: ReactPageRoutesOptions): any {
	const { pages, defaultMeta } = options
	let resultTsx = null as string | null

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		configResolved() {
			resultTsx = generate({pages, defaultMeta})
			log.info(`已開啟目錄路由功能，模塊名稱為 ${V_MODULE_NAME}...`)
		},
		configureServer(server) {
			const matchFiles = [PAGE_NAME, META_NAME]
			let isUpdating = false

			async function debounceCreate(filepath: string) {
				let filename = null as string | null

				for (let i = 0; i < pages.length; i++) {
					const [, _filename] = filepath.split(pages[i])
					if (_filename != null) filename = _filename
				}

				if (isUpdating || !filename || !(new RegExp(`(${PAGE_NAME}|${META_NAME})$`).test(filename))) return

				isUpdating = true
				resultTsx = generate({pages, defaultMeta})
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
				if (resultTsx == null) return
				return resultTsx
			}
		}
	}

	return plugin
}

export type { ReactPageRoutesOptions }
export { reactPageRoutes }
