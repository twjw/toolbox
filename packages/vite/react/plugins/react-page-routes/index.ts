import type { Plugin } from 'vite'
import {META_NAME, PAGE_NAME, create, RunOptions, RESULT_FILENAME} from "./create.ts";
import {log} from "../../../../../utils/log.ts";
import {VIRTUAL_PATH} from "../../../../../constants";
import {DEFAULT_ALIAS_NAME} from "./constants.ts";
import path from "path";
import {waitMs} from "../../../../common";

type ReactPageRoutesOptions = RunOptions & { aliasName?: string }

function reactPageRoutes(options: ReactPageRoutesOptions): any {
	const { aliasName = DEFAULT_ALIAS_NAME, ...runOptions } = options
	const aliasPath = `${VIRTUAL_PATH}/${RESULT_FILENAME}`
	const absoluteSlashAliasPath = path.resolve(process.cwd(), aliasPath).replace(/[\\]/g, '/')

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
			let isCreating = false

			async function debounceCreate(filepath: string) {
				if (isCreating || !matchFiles.includes(filepath.match(/([^\\/]+)$/)?.[0] || '')) {
					return
				}

				isCreating = true
				log.info('捕獲到新的路由頁，即將為您更新路由...')
				await waitMs(250)
				create(runOptions)
				isCreating = false

				const mod = server.moduleGraph.getModuleById(absoluteSlashAliasPath)

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
	}

	return plugin
}

export type { ReactPageRoutesOptions }
export { reactPageRoutes }
