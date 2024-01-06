import type { Plugin } from 'vite'
import { PACKAGE_NAME } from '../../../../general/constants'

const PLUGIN_NAME = 'build-drop-log'
const FULL_PLUGIN_NAME = `vite-plugin-${PACKAGE_NAME}-${PLUGIN_NAME}`
const CONSOLE_NAME = `[${PACKAGE_NAME}-${PLUGIN_NAME}]`

function buildDropLog(): any {
	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		config(_, { command }) {
			if (command === 'build') {
				console.log(`[LOG]${CONSOLE_NAME} 已開啟 console 清除功能`)
				return {
					esbuild: {
						drop: ['console', 'debugger'],
					},
				}
			}
		},
	}

	return plugin
}

export { buildDropLog }
