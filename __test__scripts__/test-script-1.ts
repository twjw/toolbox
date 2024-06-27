import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'url'

type Dictionaries = {
	[key: string]: string | Dictionaries
}

type DictionaryMap = Record<string, { dir: string; names: string[] }>

const SL = path.normalize('/')
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const FLAT_NAME = '_'

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

	return _dictionaries
}

run()
async function run() {
	const limitLocales = [
		'zh_CN', // 簡中
		'en_US', // 英文
	] as string[] | undefined
	const dirs = [
		path.resolve(__dirname, '../packages/ts/vite-react-i18n/example/base/dictionaries/one'),
		path.resolve(__dirname, '../packages/ts/vite-react-i18n/example/base/dictionaries/two'),
	]
	const filepathList = (await Promise.all(dirs.map(e => recursiveFindPaths(e)))).flat()
	const dictMap = transformSamePathMap(filepathList, dirs, FLAT_NAME)
	const dictionaries: Dictionaries = await mergeDictionaries(dictMap)

	console.log(dictMap)
	console.log(JSON.stringify(dictionaries, null, 2))
}
