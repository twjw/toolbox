import { type Plugin } from 'vite'
import { PACKAGE_NAME } from '../../../../general/constants'

type ModuleOptions = {}

const PLUGIN_NAME = 'PLUGIN_NAME'
const FULL_PLUGIN_NAME = `vite-plugin-${PACKAGE_NAME}-${PLUGIN_NAME}`

function MODULE_NAME(options?: ModuleOptions): any {
	const _options = options || {}

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
	}

	return plugin
}

export type { ModuleOptions }

export { MODULE_NAME }
