import path from 'path'
import { log } from '../../../../utils/log'
import fs from 'fs/promises'
import jsonc from 'jsonc-parser'
import { AliasOptions, ResolveOptions } from 'vite'

const tsConfigJsonName = 'tsconfig.json'
const tsConfigJsonPath = path.resolve(process.cwd(), `./${tsConfigJsonName}`)

async function getIdeaPaths() {
	try {
		const text = await fs.readFile(tsConfigJsonPath, { encoding: 'utf8' })
		const paths = jsonc.parse(text)?.compilerOptions?.paths || {}
		const dirReg = /\/\*$/
		const result = {} as Record<string, any>

		for (const k in paths) {
			result[(k as string).replace(dirReg, '')] = `/${paths[k][0].replace(dirReg, '')}`
		}

		return result
	} catch (error) {
		log.error(error, `\n解析 ${tsConfigJsonName} 失敗，取消該檔自動 alias`)
		return {}
	}
}

async function resolveConfig<Env>(envConfig: Env): Promise<{
	alias: AliasOptions
}> {
	const alias = await getIdeaPaths()

	log.info(`通過 ${tsConfigJsonName} 生成的 alias:`)
	log.info(alias)

	return {
		alias,
	}
}

export { resolveConfig }
