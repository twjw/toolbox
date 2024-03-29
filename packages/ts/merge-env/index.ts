import fs from 'fs'
import path from 'path'
import { merge } from 'lodash-es'
import { importDynamicTs } from '../../../utils/ts/node/import-dynamic-ts'

type MergeEnvOptions = {
	mode?: string // 環境變數
	dirs: string[] // absolute path
}

const SL = path.normalize('/')
const PACKAGE_NAME = `wtbx-merge-env`
const CONSOLE_NAME = `[${PACKAGE_NAME}]`

async function mergeEnv<Env extends Record<string, any>, Mode = string>(
	options: MergeEnvOptions,
): Promise<Env & { mode: Mode }> {
	try {
		if (options.mode == null) options.mode = 'development'

		// .env -> .env.local -> .env.[mode] -> .env.[mode].local
		const envIdxMap = {
			'.env.ts': 0,
			'.env.local.ts': 1,
			[`.env.${options.mode}.ts`]: 2,
			[`.env.${options.mode}.local.ts`]: 3,
		}
		let resultEnv = { mode: options.mode } as Env & { mode: Mode }

		for (let i = 0; i < options.dirs.length; i++) {
			if (!fs.existsSync(options.dirs[i])) continue

			const envPathList: string[] = Array(4).fill(undefined)
			const filenames = fs.readdirSync(options.dirs[i], { withFileTypes: true })

			for (let j = 0; j < filenames.length; j++) {
				const lstat = filenames[j]
				if (lstat.isFile()) {
					const envIdx = envIdxMap[lstat.name]
					if (envIdx != null) {
						envPathList[envIdx] = `${options.dirs[i]}${SL}${lstat.name}`
					}
				}
			}

			for (let j = 0; j < envPathList.length; j++) {
				const envPath = envPathList[j]

				if (envPath != null) {
					resultEnv = merge(resultEnv, (await importDynamicTs(envPath)).default)
					if (resultEnv instanceof Error) {
						console.error(`[ERROR]${CONSOLE_NAME} ERROR`)
						console.error(resultEnv)
						process.exit(0)
					}
				}
			}
		}

		console.log(
			`[LOG]${CONSOLE_NAME} 最終合併的 env 為：\n`,
			JSON.stringify(resultEnv, null, 2),
		)

		return resultEnv
	} catch (error) {
		console.error(`[ERROR]${CONSOLE_NAME} ERROR`)
		console.error(error as Error)
		process.exit(0)
	}
}

export type { MergeEnvOptions }
export { mergeEnv }
