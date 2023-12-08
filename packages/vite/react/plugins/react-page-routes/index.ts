import type { Plugin } from 'vite'
import {META_NAME, PAGE_NAME, create, RunOptions, RESULT_FILENAME} from "./create.ts";
import {log} from "../../../../../utils/log.ts";
import {buildFolderName} from "../../../../../constants";
import {DEFAULT_ALIAS_NAME} from "./constants.ts";

function reactPageRoutes(options: RunOptions & { aliasName?: string }): any {
	const { aliasName = DEFAULT_ALIAS_NAME, ...runOptions } = options
	const aliasPath = `/node_modules/${buildFolderName}/${RESULT_FILENAME}`

	const plugin: Plugin = {
		name: 'vite-plugin-react-page-routes',
		enforce: 'pre',
		config() {
			log.info(`vite-plugin-react-page-routes 的 vite.resolve.alias name 為 ${aliasName}`)

			return {
				resolve: {
					alias: {
						[aliasName]: aliasPath,
					},
				},
			}
		},
		configResolved() {
			create(runOptions)
		},
		configureServer(server) {
			const matchFiles = [PAGE_NAME, META_NAME]
			let debounceTimer: NodeJS.Timeout | null

			function debounceCreate(path: string) {
				if (!matchFiles.includes(path.match(/([^\\/]+)$/)?.[0] || '')) {
					return
				}

				if (debounceTimer != null) {
					clearTimeout(debounceTimer)
				}

				debounceTimer = null
				debounceTimer = setTimeout(() => {
					log.info('捕獲到新的路由頁，即將為您更新路由...')
					create(runOptions)
				}, 1000)
			}

			server.watcher.on('unlink', debounceCreate)
			server.watcher.on('add', debounceCreate)
		},
	}

	return plugin
}

export { reactPageRoutes }
