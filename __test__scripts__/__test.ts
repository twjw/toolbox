import fg from 'fast-glob'
import path from 'node:path'
import { fileURLToPath } from 'url'

type Dictionaries = {
	[key: string]: string | Dictionaries
}

const SL = path.normalize('/')
const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function resultUnitDictionaries(options: { dirs: string[] }) {
	const { dirs } = options

	if (dirs.length === 0) return null

	const filePatterns: string[] = dirs.map(e => `${e}${SL}**${SL}*.json`)
	console.log(filePatterns)
	const filepathList = await fg(filePatterns)
	const filepathMap: Record<string, { dir: string }> = {}
	let dictionaries: Dictionaries = {}

	console.log(filepathList)
	for (let i = 0; i < filepathList.length; i++) {
		const filepath = filepathList[i]
		if (dirs.length > 0) {
			for (let j = 0; j < dirs.length; j++) {
				const dtxt = dirs[j]
				if (filepath[i] !== dtxt) {
					continue
				} else if (j === dirs.length - 1) {
					filepathMap[filepath] = {
						dir: dirs[j],
					}
					break
				}
			}
		} else {
			filepathMap[filepath] = {
				dir: dirs[0],
			}
		}
	}

	console.log(filepathMap)

	return dictionaries
}

;(async () => {
	const result = await resultUnitDictionaries({
		dirs: [
			path.resolve(__dirname, '../example/base/dictionaries/base'),
			path.resolve(__dirname, '../example/base/dictionaries/replace'),
		],
	})

	console.log(result)
})()
