import path from 'path'
import fs from 'fs'
import { parse } from 'jsonc-parser'
import type { Plugin } from 'vite'
import { PACKAGE_NAME } from '../../../../general/constants'

type AutoAliasOptions = {
	filename?: string
	filepath?: string /* absolute path */
}

const CONSOLE_NAME = `[${PACKAGE_NAME}-get-idea-paths]`
function getIdeaPaths(filename: string, filepath: string) {
	try {
		const text = fs.readFileSync(filepath, { encoding: 'utf8' })
		const paths = parse(text)?.compilerOptions?.paths || {}
		const dirReg = /\/\*$/
		const result = {} as Record<string, any>

		for (const k in paths) {
			result[(k as string).replace(dirReg, '')] = `/${paths[k][0].replace(dirReg, '')}`
		}

		return result
	} catch (error) {
		console.error(`[ERROR]${CONSOLE_NAME} 解析 ${filename} 失敗，取消該檔自動 alias`)
		console.error(error)
		return {}
	}
}

function createViteAliasFromTsconfig(options?: AutoAliasOptions) {
	const {
		filename = 'tsconfig.json',
		filepath = path.resolve(process.cwd(), `./${filename}`),
	} = options || {}
	const alias = getIdeaPaths(filename, filepath)

	console.log(`[LOG]${CONSOLE_NAME} 通過 ${filename} 生成的 alias:`)
	console.log(alias)

	return alias
}

function autoAlias(options?: AutoAliasOptions): any {
	const _options = options || {}

	const plugin: Plugin = {
		name: `vite-plugin-${PACKAGE_NAME}-auto-alias`,
		enforce: 'pre',
		config() {
			const alias = createViteAliasFromTsconfig(_options)

			return {
				resolve: {
					alias,
				},
			}
		},
	}

	return plugin
}

export type { AutoAliasOptions }
export { autoAlias }
