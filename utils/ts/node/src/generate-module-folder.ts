import { fileURLToPath } from 'url'
import fs from 'node:fs/promises'
import path from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const SL = path.normalize('/')
const NODE_MODULES_NAME = 'node_modules'

/**
 * @param module {string} 可以傳入嵌套的路徑名，如： .wtbx/i18n
 */
export async function generateModuleFolder(module: string = '__default__') {
	const dirNames = __dirname.split(SL)
	let resultDirPath: string | null = null

	for (let i = dirNames.length - 1; i > 0; i--) {
		const nodeModulesPath = path.join(dirNames.slice(0, i - 1).join(SL), NODE_MODULES_NAME)

		try {
			await fs.access(nodeModulesPath)
			await fs.mkdir((resultDirPath = path.join(nodeModulesPath, `.wtbx/${module}`)), {
				recursive: true,
			})

			break
		} catch {}
	}

	return resultDirPath
}
