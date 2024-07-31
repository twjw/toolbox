import type { Plugin, ViteDevServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type Dictionaries = {
	[key: string]: string | Dictionaries
}

type DictionaryMap = Record<string, { dir: string; names: string[] }>

type InjectIdxes = {
	Dictionary: [number, number]
	// Locale 直接插入，因為不會變了
	// Locale: [number, number]
}

export type I18nOptions = {
	// 字典檔目錄絕對路徑列表(後蓋前)
	dirs: string[]
	// 字典語系檔名(zh_CN, en...)，對應字典 json 的 key，如果字典 key 比 locales 語系多也只會取出 locales 配置的語系
	locales: string[]
	// t() 的嵌套調用分隔符， example: { hello: { world: 'aaa' } } -> t('hello.world') -> 'aaa'
	separator?: string
	// 需要平舖的檔名，預設為 _
	flatName?: string
}

type _GlobMap = Record<string, string> // <locale, globPath>

const PACKAGE_NAME = 'vite-react-i18n'
const PLUGIN_NAME = `@wtbx/${PACKAGE_NAME}`
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`
const V_MODULE_NAME = `~i18n`
const V_MODULE_ID = `~${V_MODULE_NAME}.jsx`
const CONSOLE_NAME = `[${PLUGIN_NAME}]`
const SL = path.normalize('/')
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DEFAULT_FLAT_NAME = '_'
const DEFAULT_SEPARATOR = '.'
const INJECT_SYM = '__INJECT__'
const VIRTUAL_CLIENT_TYPE_NAME = 'client.d.ts'

function _generateLangGlobPath({ dirs }: Pick<I18nOptions, 'dirs'>) {
	const globMap = {} as _GlobMap
	const matchExtReg = /\.(ts|json)$/

	try {
		const filePathMap = {} as Record<string, 1> // <relativeFilepath>

		for (let i = 0; i < dirs.length; i++) {
			if (i > 0 && !fs.existsSync(dirs[i])) continue

			const dir = dirs[i]
			const files = fs.readdirSync(dir)

			for (let j = 0; j < files.length; j++) {
				const file = files[j]
				const filepath = path.join(dir, file)
				const stat = fs.lstatSync(filepath)

				if (stat.isFile() && matchExtReg.test(file)) {
					filePathMap[path.relative(process.cwd(), filepath)] = 1
				}
			}
		}

		for (const relativeFilepath in filePathMap) {
			const globPath = `${relativeFilepath.replace(/[\\]/g, '/')}`
			const filename = globPath.match(/[^\\/]+$/)?.[0]!

			globMap[filename.replace(matchExtReg, '')] = `./${globPath}`
		}

		return globMap
	} catch (error) {
		console.error(`[ERROR]${CONSOLE_NAME} 讀取字典檔失敗`)
		console.error(error)
		process.exit(0)
	}
}

function _generateStringModule({
	globMap,
	separator = DEFAULT_SEPARATOR,
}: {
	globMap: _GlobMap
	separator?: string
}) {
	const firstLocale = Object.keys(globMap)[0]
	const firstLocaleStr = firstLocale ? `'${firstLocale}'` : null
	const globMapEntries = Object.entries(globMap)
	const globImportStrings = globMapEntries.map(
		([locale, path]) => `'${locale}': () => import('${path}', { assert: { type: "json" } })`,
	)
	const locales = globMapEntries.map(([locale]) => `'${locale}'`)

	return `
import { useState, useEffect, Fragment } from 'react'

// Record{string, Promise{any} | any} _globMap 轉換 key 為 locale 塞入的字典檔
const _dictionaryMap = { ${globImportStrings.join(',\n')} } 

// 當前字典
let dictionary = {} 

// string[] 項目的語系列表
const localeList = [${locales.join(', ')}]

// 當前語系
let locale = localeList[0]

let _forceUpdate // 強刷 APP 組件

function _recurFindKeyValue (
	obj,
	key,
) {
	if (typeof key !== 'string') return undefined

	const keys = key.split('${separator}')
	let result = obj
	let k

	while ((k = keys.shift()) != null) {
		result = result[k]
		if (typeof result !== 'object') break
	}

	if (keys.length > 0) return undefined

	return result
}

function _parseValue(text, idxValList, keyValMap) {
	if (!idxValList?.length && keyValMap == null) return text

  const matchList = []
  let result = ''
  let isSkip = false
  let start = -1
  
  idxValList = idxValList || []
  keyValMap = keyValMap || {}
  
  for (let i = 0; i < text.length; i++) {
    const e = text[i]
    
    if (start > -1) {
      if (e === '}') {
        const k = text.substring(start + 1, i)
        const isIdx = /^\\d+$/.test(k)
        matchList.push([isSkip, isIdx, isIdx ? Number(k) : k, start, i])
        
        isSkip = false
        start = -1
      }
    } else if (e === '{') {
      isSkip = text[i - 1] === '\\\\'
      start = i
    }
  }
  
  if (matchList.length === 0) {
    result = text
  } else {
    // 3 start, 4 end
    if (matchList[0][3] > 0) {
      if (matchList[0][0]) {
        result += text.substring(0, matchList[0][3] - 1)
      } else {
        result += text.substring(0, matchList[0][3])
      }
    }
    
    for (let i = 0; i < matchList.length; i++) {
      const [isSkip, isIdx, key, start] = matchList[i]

      if (i > 0) {
        if (isSkip) {
          result += text.substring(matchList[i - 1][4] + 1, start - 1) 
        } else {
          result += text.substring(matchList[i - 1][4] + 1, start) 
        }
      }
      
      if (isSkip) {
        result += \`{\${key}}\`
      } else {
				const replaceText = isIdx ? idxValList[key] : keyValMap[key]
				if (replaceText == null) result += \`{\${key}}\`
				else result += replaceText
      }
    }
    
    if (matchList[matchList.length - 1][4] < text.length - 1) {
      result += text.substring(matchList[matchList.length - 1][4] + 1, text.length)
    }
  }
  
  return result
}

function t(key, idxValList, keyValMap) {
  const result = _recurFindKeyValue(dictionary, key)
  
  if (result === undefined) return key
  
  return _parseValue(result, idxValList, keyValMap)
}

async function _updateLocale(_locale) {
  if (typeof _dictionaryMap[_locale] === 'function') {
    _dictionaryMap[_locale] = await _dictionaryMap[_locale]()
  }
  
  dictionary = _dictionaryMap[_locale]
  locale = _locale
}

function _notFoundLocaleWarn (_locale = locale) {
  console.warn(\`not found locale \${_locale}\`)
}

async function setLocale(_locale, auto = true) {
  if (_dictionaryMap[_locale] == null) {
    _notFoundLocaleWarn()
    return
  }
  
  await _updateLocale(_locale)
  
  if (auto) {
    _forceUpdate?.()
    return
  }
  
  return _forceUpdate
}

function App({ defaultLocale, fallback, children }) {
  const [i, update] = useState(0)
  
  useEffect(() => {
    const hasAny = 
      (locale = defaultLocale || ${firstLocaleStr}) != null 
        && _dictionaryMap[locale] != null

    if (hasAny) {
      _forceUpdate = () => update(i => i + 1)
      _updateLocale(locale).then(() => {
        _forceUpdate()
      })
    } else {
      _notFoundLocaleWarn()
    }
  }, [])
  
  if (i === 0) return fallback || <></>
  return <Fragment key={i}>{children}</Fragment>
}

export { dictionary, locale, t, setLocale, App }
`
}

export function i18n(options: I18nOptions): any {
	const {
		dirs,
		locales,
		separator = DEFAULT_SEPARATOR,
		flatName = DEFAULT_FLAT_NAME,
	} = options || {}
	let dictMap: DictionaryMap | null = null
	let dictionaries: Dictionaries | null = null
	let isBuild = false

	// TODO 之後要擴展 tnode() 功能
	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		config(_, { command }) {
			isBuild = command === 'build'
		},
		async configResolved() {
			const filepathList = (await Promise.all(dirs.map(e => recursiveFindPaths(e)))).flat()
			dictMap = transformSamePathMap(filepathList, dirs, flatName)
			dictionaries = await mergeDictionaries(dictMap)
			const { baseTypeString, injectIdxes } = await matchVirtualTypes(locales)
			if (isBuild) await generateDictionaryFiles(dictionaries)
			if (dictionaries != null) {
				await generateVirtualTypes(
					dictionaries[Object.keys(dictionaries)[0]] as Dictionaries,
					baseTypeString,
					injectIdxes,
				)

				await generateLocaleFiles(dictionaries)
			}
			console.log(`[LOG]${CONSOLE_NAME} 已開啟多語系功能，模塊名稱為 ${V_MODULE_NAME}...`)
		},
		configureServer(server) {
			server.watcher.on('unlink', filepath => {})

			server.watcher.on('add', filepath => {})

			server.watcher.on('change', filepath => {
				console.log(filepath, dirs)
			})
		},
		resolveId(id) {
			if (id === V_MODULE_NAME) {
				return V_MODULE_ID
			}
		},
		load(id) {
			if (id === V_MODULE_ID) {
				if (locales.length === 0) return

				const globMap: Record<string, string> = {}

				locales.forEach(locale => {
					// prettier-ignore
					globMap[locale] = `./${
						path.relative(
							process.cwd(),
							// TODO 編譯要手動切換(懶得自動了)
							// /* production */ path.resolve(__dirname, `locales/${locale}.json`),
							
							/* development */ path.resolve(process.cwd(), `node_modules/wtbx-${PACKAGE_NAME}/dist/locales/${locale}.json`),
						)
							.replace(/\\/g, '/')
					}`
				})

				return _generateStringModule({ globMap, separator })
			}
		},
	}

	return plugin
}

async function recursiveFindPaths(dirPath: string, result: string[] = []) {
	const pathList = await fs.promises.readdir(dirPath, { withFileTypes: true })

	for (let i = 0; i < pathList.length; i++) {
		const e = pathList[i]
		const filepath = path.join(dirPath, e.name)

		if (e.isDirectory()) {
			await recursiveFindPaths(filepath, result)
		} else if (/\.json$/.test(e.name)) {
			result.push(filepath)
		}
	}

	return result
}

function transformSamePathMap(filepathList: string[], dirs: string[], flatName: string) {
	const filepathMap: DictionaryMap = {}

	if (dirs.length === 0) return filepathMap

	for (let i = 0; i < filepathList.length; i++) {
		const filepath = filepathList[i]
		if (dirs.length > 0) {
			for (let j = 0; j < dirs.length; j++) {
				const dir = dirs[j]
				let isBreak = false

				for (let k = 0; k < dir.length; k++) {
					const dirTxt = dir[k]

					if (filepath[k] !== dirTxt) {
						break
					} else if (k === dir.length - 1) {
						const relativeFilepath = filepath.substring(dir.length)

						filepathMap[relativeFilepath] = {
							dir,
							names: relativeFilepath
								.substring(SL.length, relativeFilepath.length - 5)
								.split(SL)
								.filter(e => e !== flatName),
						}
						isBreak = true
						break
					}
				}

				if (isBreak) break
			}
		} else {
			filepathMap[filepath] = {
				dir: dirs[0],
				names: [],
			}
		}
	}

	return filepathMap
}

async function mergeDictionaries(dictMap: DictionaryMap, dictionaries?: Dictionaries) {
	const _dictionaries: Dictionaries = dictionaries || {}

	for (let relativeFilepath in dictMap) {
		const { dir, names } = dictMap[relativeFilepath]
		const filepath = dir + relativeFilepath

		try {
			const dict = JSON.parse(await fs.promises.readFile(filepath, 'utf-8'))

			for (let key in dict) {
				const dv = dict[key]

				for (let dvKey in dv) {
					let node = _dictionaries

					// 將 _dictionaries 根寫上語系
					if (node[dvKey] == null) node[dvKey] = {}
					node = node[dvKey] as Dictionaries

					for (let i = 0; i < names.length; i++) {
						const name = names[i]
						if (node[name] == null) node[name] = {}
						node = node[name] as Dictionaries
					}

					node[key] = dv[dvKey]
				}
			}
		} catch {}
	}

	if (Object.keys(_dictionaries).length === 0) return null

	/* 結果會像是
		{
			zh_CN: { hello: '你好', skill: { code: '寫程式' } },
			en_US: { hello: 'hello', skill: { code: 'coding' } },
		}
	 */
	return _dictionaries
}

async function generateDictionaryFiles(dictionaries: Dictionaries | null) {
	if (dictionaries == null) return
	return Promise.all(
		Object.keys(dictionaries).map(locale =>
			fs.promises.writeFile(
				path.join(__dirname, `${locale}.ts`),
				`export default ${JSON.stringify(dictionaries[locale], null, 2)}`,
			),
		),
	)
}

async function matchVirtualTypes(locales: string[]) {
	let typeStr = await fs.promises.readFile(
		path.join(__dirname, `templates/${VIRTUAL_CLIENT_TYPE_NAME}`),
		'utf-8',
	)
	const injectIdxes: InjectIdxes = {
		Dictionary: [0, 0],
		// Locale 直接插入，因為不會變了
		// Locale: [0, 0] as [number, number],
	}
	const injectRegexp = new RegExp(`type\\s([A-z0-9]+)\\s?=\\s?(${INJECT_SYM})`, 'g')
	let matchArray

	while ((matchArray = injectRegexp.exec(typeStr)) !== null) {
		const startIdx = matchArray.index
		const endIdx = injectRegexp.lastIndex

		if (matchArray[1] === 'Locale') {
			typeStr = appendInjectText(endIdx, typeStr, createLocaleTypeString(locales))
		} else {
			injectIdxes[matchArray[1] as keyof typeof injectIdxes] = [startIdx, endIdx]
		}
	}

	return {
		baseTypeString: typeStr,
		injectIdxes,
	}
}

async function generateVirtualTypes(
	dict: Dictionaries,
	baseTypeString: string,
	injectIdxes: InjectIdxes,
) {
	await fs.promises.writeFile(
		path.join(__dirname, VIRTUAL_CLIENT_TYPE_NAME),
		appendInjectText(
			injectIdxes.Dictionary[1],
			baseTypeString,
			createDictionaryTypeString(dict),
		),
	)
}

async function generateLocaleFiles(dict: Dictionaries) {
	for (let locale in dict) {
		await fs.promises.writeFile(
			path.join(__dirname, `locales/${locale}.json`),
			JSON.stringify(dict[locale]),
		)
	}
}

function appendInjectText(endIdx: number, text: string, injectText: string) {
	return `${text.substring(0, endIdx - INJECT_SYM.length)}${injectText}${text.substring(endIdx)}`
}

function createDictionaryTypeString(dict: Dictionaries) {
	if (Object.keys(dict).length === 0) return 'Record<string, string>'
	let result = '{'

	recursiveEachObj<string>(dict as Record<string, string>, (k, v) => {
		result += `${result.length > 1 ? ',' : ''}'${k}':string`
	})

	return `${result}}`
}

function createLocaleTypeString(locales: string[]) {
	return locales.map(e => `'${e}'`).join(' | ')
}

function recursiveEachObj<T = any>(
	obj: Record<string, T>,
	callback: (key: string, value: T) => void,
	prevKey = '',
) {
	for (let k in obj) {
		const nextKey = `${prevKey ? `${prevKey}.` : ''}${k}`

		if (typeof obj[k] === 'object') {
			recursiveEachObj(obj[k] as Record<string, T>, callback, nextKey)
		} else {
			callback(nextKey, obj[k])
		}
	}
}

function moduleHotUpdate(server: ViteDevServer) {
	const mod = server.moduleGraph.getModuleById(V_MODULE_ID)

	if (mod) {
		server.moduleGraph.invalidateModule(mod)
		server.hot.send({
			type: 'full-reload',
		})
	}
}
