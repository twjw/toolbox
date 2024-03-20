import type { Plugin } from 'vite'
import { AntdLocale, DayjsLocale } from './type'

export * from './type'

type AntdLocaleImportOptions<K extends string = string> = {
	locales: Record<K, { antd: AntdLocale; dayjs: DayjsLocale; description?: string }>
}

const PLUGIN_NAME = 'wtbx-vite-antd-locale-import'
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`
const CONSOLE_NAME = `[${PLUGIN_NAME}]`
const V_MODULE_NAME = `~import-antd-locales`
const V_MODULE_ID = `@@${V_MODULE_NAME}`

function antdLocaleImport<K extends string = string>({
	locales,
}: AntdLocaleImportOptions<K>): any {
	let moduleResult: string | undefined

	if (Object.keys(locales).length === 0) {
		console.error(`[ERROR]${CONSOLE_NAME} 至少要有一個 key-value`)
		process.exit(0)
	}

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		resolveId(id) {
			if (id === V_MODULE_NAME) {
				return V_MODULE_ID
			}
		},
		load(id) {
			if (id === V_MODULE_ID) {
				if (moduleResult != null) return moduleResult

				moduleResult = 'function antdLocaleImport (key) {'

				for (let k in locales) {
					moduleResult += `
            if (key === '${k}')
              return Promise.all([
                import('antd/es/date-picker/locale/${locales[k].antd}'),
                import('antd/locale/${locales[k].antd}'),
                import('dayjs/locale/${locales[k].dayjs}'),
              ])
          `
				}

				moduleResult += `}
        
        export default antdLocaleImport`

				return moduleResult
			}
		},
	}

	return plugin
}

export type { AntdLocaleImportOptions }
export { antdLocaleImport }
