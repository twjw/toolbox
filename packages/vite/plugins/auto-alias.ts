import path from 'path'
import { log } from '../../../utils/log'
import fs from 'fs'
import jsonc from 'jsonc-parser'
import type { Plugin } from "vite";
import { buildFolderName, envConfigFilename, envConfigModuleFromName } from '../../../constants'

type AutoAliasOptions = {
	filename?: string
	filepath?: string /* absolute path */
	hasEnv?: boolean
	envFromName?: string
}

function getIdeaPaths(filename: string, filepath: string) {
	try {
		const text = fs.readFileSync(filepath, { encoding: 'utf8' })
		const paths = jsonc.parse(text)?.compilerOptions?.paths || {}
		const dirReg = /\/\*$/
		const result = {} as Record<string, any>

		for (const k in paths) {
			result[(k as string).replace(dirReg, '')] = `/${paths[k][0].replace(dirReg, '')}`
		}

		return result
	} catch (error) {
		log.error(error, `\n解析 ${filename} 失敗，取消該檔自動 alias`)
		return {}
	}
}

function createViteAliasFromTsconfig(options?: AutoAliasOptions) {
	const { filename = 'tsconfig.json', filepath = path.resolve(process.cwd(), `./${filename}`) } = options || {}
	const alias = getIdeaPaths(filename, filepath)

	if (options?.hasEnv) {
		alias[envConfigModuleFromName] = `/node_modules/${buildFolderName}/${envConfigFilename}`
	}

	log.info(`通過 ${filename} 生成的 alias:`)
	log.info(alias)

	return alias
}

function autoAlias (options?: AutoAliasOptions): any {
	const _options = options || {}

	if (_options.hasEnv == null) {
		_options.hasEnv = true
	}

	if (_options.envFromName == null) {
		_options.envFromName = envConfigModuleFromName
	}

	const plugin: Plugin = {
		name: 'vite-plugin-auto-alias',
		enforce: 'pre',
		config() {
			const alias = createViteAliasFromTsconfig(_options)

			return {
				resolve: {
					alias,
				}
			}
		}
	}

	return plugin
}

export type {
	AutoAliasOptions,
}
export {
	autoAlias
}
