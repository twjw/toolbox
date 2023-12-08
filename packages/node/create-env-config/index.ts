import path from 'path'
import fs from 'fs/promises'
import JSON5 from 'json5'
import { cloneDeep, isObject, merge } from 'lodash-es'
import { log } from '../../../utils/log'
import { checkNewBuildGitIgnore, getBuildPath } from '../../../utils/node/build-path.ts'
import { envConfigFilename, envConfigModuleName } from './constants'

type ConfigExt = 'json' | 'ts'
type TransformEnvConfig<Env, Mode, Result> = (envConfig: Env & { mode: Mode }) => Result
type CreateEnvConfigOptions<Env, Mode, Result> = {
	mode: Mode
	dirPath?: string /* absolute path */
	extension?: ConfigExt
	transform?: TransformEnvConfig<Env, Mode, Result>
	moduleName?: string
}

const extJson = 'json'
const extTs = 'ts'
const supportExtensions = [extJson, extTs]
const tsSym = '// --- ---'
const outputDirPath = getBuildPath()
const outputPath = path.resolve(process.cwd(), `${outputDirPath}/${envConfigFilename}`)

const _passConfig = async (
	dirPath: string,
	privateKeys: Record<string, any>,
	config: Record<string, any>,
	filename: string,
	extension: ConfigExt,
) => {
	const _configBuffer = await fs.readFile(path.resolve(dirPath, filename))

	try {
		let _config = {}
		const text = _configBuffer.toString()

		if (extension === extJson) {
			_config = JSON.parse(text)
		} else if (extension === extTs) {
			const symReg = new RegExp(tsSym, 'gi')
			const ranges = []
			let match

			while ((match = symReg.exec(text)) !== null) {
				ranges.push(match.index)
			}

			if (ranges.length < 2) throw 'break'

			_config = JSON5.parse(text.substring(ranges[0] + tsSym.length, ranges[1]).trim())
		}

		const { obj: publicConfig } = _privateKeyToPublic({
			obj: _config,
			privateKeys,
		})

		merge(config, publicConfig)
	} catch (error) {
		log.error(error, `\n${filename} 解析失敗，忽略該配置`)
	}
}

const _passParentKeys = (parentKeys: string[] | undefined, key: string) => {
	let _parentKeys: string[]

	if (parentKeys) {
		_parentKeys = parentKeys
		_parentKeys.push(key)
	} else {
		_parentKeys = [key]
	}

	return _parentKeys
}

const _privateKeyToPublic = ({
	obj,
	prefix = '_',
	privateKeys = {},
	parentKeys,
}: {
	obj: Record<string, any>
	prefix?: string
	privateKeys?: Record<string, any>
	parentKeys?: string[]
}) => {
	for (const k in obj) {
		let _k = k

		if (new RegExp(`^${prefix}`).test(k)) {
			obj[(_k = k.substring(prefix.length))] = obj[k]
			delete obj[k]

			if (parentKeys?.length) {
				let prev = privateKeys
				for (let i = 0; i < parentKeys.length; i++) {
					if (prev[parentKeys[i]] == null) {
						prev = prev[parentKeys[i]] = {}
					} else {
						prev = prev[parentKeys[i]]
					}
				}

				prev[_k] = 1
			}
		}

		if (isObject(obj[_k])) {
			let _parentKeys: string[] | undefined

			if (isObject(obj[_k])) {
				_parentKeys = _passParentKeys(parentKeys, _k)
			}

			_privateKeyToPublic({
				obj: obj[_k],
				prefix,
				privateKeys,
				parentKeys: _parentKeys,
			})
		}
	}

	return {
		obj,
		privateKeys,
	}
}

const _removePrivateKeyValue = (obj: Record<string, any>, removeKeyObj: any) => {
	if (isObject(removeKeyObj)) {
		for (let k in removeKeyObj) {
			if ((removeKeyObj as Record<string, any>)[k] === 1) {
				if (isObject(obj)) {
					delete obj[k]
				}
			} else if (isObject((removeKeyObj as Record<string, any>)[k])) {
				let _obj = isObject(obj) ? obj[k] : null
				_removePrivateKeyValue(_obj, (removeKeyObj as Record<string, any>)[k])
			}
		}
	}
}

const _dontTransform = <R>(e: any) => e as R

const createEnvConfig = async <
	Env,
	Mode = string,
	Result extends Record<string, any> = Env & { mode: Mode },
>(
	options: CreateEnvConfigOptions<Env, Mode, Result>,
): Promise<Result> => {
	const {
		mode,
		dirPath = process.cwd(),
		extension = extTs,
		transform = _dontTransform,
		moduleName = envConfigModuleName,
	} = options

	log.info('開始創建環境變數...')

	let config = {
		mode,
	} as (Env & { mode: Mode }) | Result
	let privateKeys = {} as Record<string, any>

	if (supportExtensions.includes(extension)) {
		const ls = await fs.readdir(dirPath)
		const baseFileName = `.env.${extension}`
		const filterBaseLs = ls.filter(e => e === baseFileName)

		if (ls.length > 0 && filterBaseLs.length !== ls.length)
			await _passConfig(dirPath, privateKeys, config, baseFileName, extension)

		for (let i = 0; i < ls.length; i++) {
			const filename = ls[i]
			const env = filename.match(/^\.env\.?([A-z0-9-_]+)?\.(ts|json)$/)?.[1]
			if (env === mode) await _passConfig(dirPath, privateKeys, config, filename, extension)
		}

		config = transform(config as Env & { mode: Mode })
		const viteConfig = cloneDeep(config)
		_removePrivateKeyValue(viteConfig, privateKeys)

		await checkNewBuildGitIgnore()
		await fs.writeFile(
			outputPath,
			`export const ${moduleName} = ${JSON.stringify(viteConfig, null, 2)}`,
		)
	}

	log.info('環境變數創建完畢！環境變數為：')
	log.info(JSON.stringify(config, null, 2))

	return config as Result
}

export type { ConfigExt, TransformEnvConfig, CreateEnvConfigOptions }
export { createEnvConfig }
