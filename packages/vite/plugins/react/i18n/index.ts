import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { log } from '../../../../../utils/log.ts'
import { waitMs } from '../../../../common'

type ReactI18nOptions = {
	dirs: string[] // 字典檔目錄絕對路徑列表(後蓋前)
}

type _GlobMap = Record<string, string> // <locale, globPath>

const PLUGIN_NAME = 'i18n'
const FULL_PLUGIN_NAME = `vite-plugin-wtbx-react-${PLUGIN_NAME}`
const V_MODULE_NAME = `~${PLUGIN_NAME}`
const V_MODULE_ID = `@@${V_MODULE_NAME}.jsx`

function _generateLangGlobPath({ dirs }: Required<ReactI18nOptions>) {
	const globMap = {} as _GlobMap
	const matchExtReg = /\.(ts|json)$/

	try {
		const filePathMap = {} as Record<string, 1> // <relativeFilepath>

		for (let i = 0; i < dirs.length; i++) {
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
		log.error(`${FULL_PLUGIN_NAME} 讀取字典檔失敗`)
		log.error(error)
		process.exit(0)
	}
}

function _generateStringModule({ globMap }: { globMap: _GlobMap }) {
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
	separator = '.',
) {
	if (typeof key !== 'string') return undefined

	const keys = key.split(separator)
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
        if (isIdx) {
          const replaceText = idxValList[key]
          result += ((typeof replaceText === 'number' ? String(replaceText) : replaceText) || \`{\${key}}\`)
        } else {
          const replaceText = keyValMap[key]
          result += ((typeof replaceText === 'number' ? String(replaceText) : replaceText) || \`{\${key}}\`)
        }
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

async function setLocale(_locale) {
  if (_dictionaryMap[_locale] == null) {
    _notFoundLocaleWarn()
    return
  }
  
  await _updateLocale(_locale)
  _forceUpdate?.()
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

function reactI18n(options: ReactI18nOptions): any {
	const { dirs } = options || {}
	let globMap: _GlobMap = {} // [[relativePath, filename(no-ext)], ...[]]

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		configResolved() {
			globMap = _generateLangGlobPath({ dirs })
			log.info(`已開啟多語系功能，模塊名稱為 ${V_MODULE_NAME}...`)
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

				const mod = server.moduleGraph.getModuleById(V_MODULE_ID)

				if (mod) {
					server.moduleGraph.invalidateModule(mod)
					server.ws.send({
						type: 'full-reload',
					})
				}
			}

			server.watcher.on('unlink', debounceGenerate)
			server.watcher.on('add', debounceGenerate)
		},
		resolveId(id) {
			if (id === V_MODULE_NAME) {
				return V_MODULE_ID
			}
		},
		load(id) {
			if (id === V_MODULE_ID) {
				if (Object.keys(globMap).length === 0) return
				return _generateStringModule({ globMap })
			}
		},
	}

	return plugin
}

export type { ReactI18nOptions }

export { reactI18n }
