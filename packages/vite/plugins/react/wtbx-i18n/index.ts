import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { log } from '../../../../../utils/log.ts'
import { waitMs } from '../../../../common'

type WtbxI18nOptions = {
	dirs: string[] // 字典檔目錄絕對路徑列表(後蓋前)
}

type _GlobMap = Record<string, string> // <locale, globPath>

const PLUGIN_NAME = 'wtbx-i18n'
const FULL_PLUGIN_NAME = `vite-plugin-${PLUGIN_NAME}`
const V_MODULE_NAME = `~${PLUGIN_NAME}`
const V_MODULE_ID = `@@${V_MODULE_NAME}.jsx`

function _generateLangGlobPath({ dirs }: Required<WtbxI18nOptions>) {
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
import { recurFindKeyStrValue } from 'wtbx/common'

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

function t(key, values = []) {
  let result = recurFindKeyStrValue(dictionary, key)

  if (!values.length) return result

  for (let i = 0; i < values.length; i++) {
    result = result.replace(/\\{[0-9]+}/, values[i])
  }

  return result
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

function wtbxI18n(options: WtbxI18nOptions): any {
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

export type { WtbxI18nOptions }

export { wtbxI18n }
