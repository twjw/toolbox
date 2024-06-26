import type { Plugin, ViteDevServer } from 'vite'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'

type UniteDictionaries = Record<string, Record<string, string>>

type Dictionaries = {
	[key: string]: string | Dictionaries
}

type I18nOptions = {
	// 字典檔目錄絕對路徑列表(後蓋前)
	dirs: string[]
	// 字典語系檔名(zh_CN, en...)，對應字典 json 的 key，如果字典 key 比 locales 語系多也只會取出 locales 配置的語系
	locales: string[]
	// 整合參數有傳任一個都會自動產出各語系的檔案到 dirs 下
	// 整合字典格式範例 { [key]: { [`可選的語系描述(語系名)`]: 翻譯文字 } }
	// {
	//   "hello": {
	//     "簡體中文(zh_CN)": "你好",
	//     "英文(en)": "Hello"
	//   }
	// }
	// t() 的嵌套調用分隔符， example: { hello: { world: 'aaa' } } -> t('hello.world') -> 'aaa'
	separator?: string
}

type _GlobMap = Record<string, string> // <locale, globPath>

const PLUGIN_NAME = '@wtbx/vite-react-i18n'
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`
const V_MODULE_NAME = `~i18n`
const V_MODULE_ID = `~${V_MODULE_NAME}.jsx`
const CONSOLE_NAME = `[${PLUGIN_NAME}]`
const SL = path.normalize('/')

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
	separator = '.',
}: {
	globMap: _GlobMap
	separator?: string
}) {
	const firstLocale = Object.keys(globMap)[0]
	const firstLocaleStr = firstLocale ? `'${firstLocale}'` : null

	return `
import { useState, useEffect, Fragment } from 'react'

const _dictionaryMap = {
  ${Object.entries(globMap)
		.map(([locale, path]) => `'${locale}': () => import('${path}')`)
		.join(',\n')}
} // Record{string, Promise{any} | any} _globMap 轉換 key 為 locale 塞入的字典檔
let dictionary = {} // 當前字典

const localeList = ${`[${Object.keys(globMap)
		.map(e => `'${e}'`)
		.join(', ')}]`} // string[] 項目的語系列表
let locale = localeList[0] // 當前語系

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
    _dictionaryMap[_locale] = (await _dictionaryMap[_locale]()).default
  }
  
  dictionary = _dictionaryMap[_locale]
  locale = _locale
}

function _notFoundLocaleWarn () {
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

async function resultUnitDictionaries(options: Pick<I18nOptions, 'dirs'>) {
	const { dirs } = options

	if (dirs.length === 0) return null

	const filePatterns: string[] = dirs.map(e => `${e}${SL}**${SL}*.json`)
	const filePaths = await fg(filePatterns)
	const fileMap: Record<string, { dir: string }> = {}
	let dictionaries: Dictionaries = {}

	for (let i = 0; i < filePaths.length; i++) {
		const filepath = filePaths[i]
		if (dirs.length > 0) {
			for (let j = 0; j < dirs.length; j++) {
				const dtxt = dirs[j]
				if (filepath[i] !== dtxt) {
					continue
				} else if (j === dirs.length - 1) {
					fileMap[filepath] = {
						dir: dirs[j],
					}
					break
				}
			}
		} else {
			fileMap[filepath] = {
				dir: dirs[0],
			}
		}
	}

	return dictionaries

	// const hasUniteDictionaries = uniteDictionaries != null
	// const hasUniteFilepath = uniteFilepath != null
	// let dictionaries: UniteDictionaries | null = hasUniteDictionaries ? uniteDictionaries : null
	//
	// if (hasUniteDictionaries || hasUniteFilepath) {
	// 	if (dictionaries == null) {
	// 		dictionaries = JSON.parse(fs.readFileSync(uniteFilepath!, 'utf-8')) as UniteDictionaries
	// 	}
	// }
}

async function generateLocalesByUniteDictionaries(
	dirs: string[],
	uniteDictionaries: UniteDictionaries,
) {
	let locales: Record<string, Record<string, string>> = {}

	for (let k in uniteDictionaries) {
		const dict = uniteDictionaries[k]

		for (let dk in dict) {
			const locale = dk.match(/\(([-_A-z]+)\)$/)
			if (locale != null) {
				if (locales[locale[1]] == null) locales[locale[1]] = {}
				locales[locale[1]][k] = dict[dk]
			}
		}
	}

	const localesKeys = Object.keys(locales)
	if (dirs.length === 0 || localesKeys.length === 0) return

	await Promise.all(
		localesKeys.map(locale =>
			fs.promises.writeFile(
				path.resolve(dirs[dirs.length - 1], `${locale}.ts`),
				`const lang = ${JSON.stringify(locales[locale], null, 2)} as const

export default lang`,
			),
		),
	)
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

function i18n(options: I18nOptions): any {
	const { dirs, limitLocales, separator = '.' } = options || {}
	let globMap: _GlobMap = {} // [[relativePath, filename(no-ext)], ...[]]

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		async configResolved() {
			const uniteDictionaries = await resultUnitDictionaries(options)
			if (uniteDictionaries != null)
				await generateLocalesByUniteDictionaries(dirs, uniteDictionaries)
			globMap = _generateLangGlobPath({ dirs })
			console.log(`[LOG]${CONSOLE_NAME} 已開啟多語系功能，模塊名稱為 ${V_MODULE_NAME}...`)
		},
		configureServer(server) {
			let isUpdating = false

			async function debounceGenerate(filepath: string) {
				let filename = null as string | null

				for (let i = 0; i < dirs.length; i++) {
					const [, _filename] = filepath.split(dirs[i])
					if (_filename != null) filename = _filename
				}

				if (isUpdating || !filename || !/^\\[A-z0-9-_]+\.(ts|json)$/.test(filename)) return

				isUpdating = true
				globMap = _generateLangGlobPath({ dirs })
				await waitMs(250)
				isUpdating = false

				moduleHotUpdate(server)
			}

			server.watcher.on('unlink', debounceGenerate)
			server.watcher.on('add', debounceGenerate)

			const { uniteFilepath } = options
			if (uniteFilepath != null) {
				server.watcher.add(uniteFilepath)
				server.watcher.on('change', async filepath => {
					if (filepath === uniteFilepath) {
						try {
							const uniteDictionaries = JSON.parse(
								fs.readFileSync(filepath, 'utf-8'),
							) as UniteDictionaries
							// TODO 尚有優化空間，比方說頻繁更改導致衝突可以使用排隊處理，但先不做，發生頻率不高
							await generateLocalesByUniteDictionaries(dirs, uniteDictionaries)
							await waitMs(250)
							moduleHotUpdate(server)
						} catch {
							console.error(`[ERROR]${CONSOLE_NAME} 整合字典json檔語法錯誤導至熱更失敗，請確認`)
						}
					}
				})
			}
		},
		resolveId(id) {
			if (id === V_MODULE_NAME) {
				return V_MODULE_ID
			}
		},
		load(id) {
			if (id === V_MODULE_ID) {
				if (Object.keys(globMap).length === 0) return
				return _generateStringModule({ globMap, separator })
			}
		},
	}

	return plugin
}

function waitMs(timeout = 1000) {
	return new Promise<void>(resolve => {
		setTimeout(() => {
			resolve()
		}, timeout)
	})
}

export { type UniteDictionaries, type I18nOptions, i18n }
