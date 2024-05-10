import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import esbuild from 'esbuild'
import { URL } from 'node:url'

type MergeEnvOptions = {
	mode?: string // 環境變數
	dirs: string[] // absolute path
}

const SL = path.normalize('/')
const PACKAGE_NAME = `wtbx-merge-env`
const CONSOLE_NAME = `[${PACKAGE_NAME}]`
const TEMP_FILENAME = '__temp-ts-env-code.ts'
const OUT_FILENAME = '__out.js'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ABSOLUTE_TEMP_FILEPATH = path.resolve(__dirname, TEMP_FILENAME)
const ABSOLUTE_OUT_FILEPATH = path.resolve(__dirname, OUT_FILENAME)

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
		const envIdxMapKeys = Object.keys(envIdxMap)
		let tempTsCode = `import { merge } from 'lodash-es'
`
		let moduleId = 0

		for (let i = 0; i < options.dirs.length; i++) {
			if (!fs.existsSync(options.dirs[i])) continue

			const envPathList: string[] = Array(envIdxMapKeys.length).fill(undefined)
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
					let relativeEnvPath = path.relative(__dirname, envPath).replace(/\\/g, '/')
					if (relativeEnvPath[0] !== '.') {
						if (relativeEnvPath.length) {
							relativeEnvPath = `./${relativeEnvPath}`
						} else {
							relativeEnvPath = '.'
						}
					}
					tempTsCode += `import envConfig${++moduleId} from '${relativeEnvPath}'
`
				}
			}
		}

		let resultEnv: any = null

		if (moduleId > 0) {
			tempTsCode += `const envConfig = merge(`
			for (let i = 0; i < moduleId; i++) {
				tempTsCode += `envConfig${i + 1}, `
			}
			tempTsCode += `)
export default envConfig`

			fs.writeFileSync(ABSOLUTE_TEMP_FILEPATH, tempTsCode)
			await esbuild.build({
				entryPoints: [TEMP_FILENAME],
				bundle: true,
				platform: 'node',
				target: 'node14',
				format: 'esm',
				outfile: OUT_FILENAME,
				loader: {
					'.ts': 'ts',
				},
				external: ['lodash-es'],
			})

			const jsImportPath = `./${OUT_FILENAME}`
			resultEnv = (await import(jsImportPath)).default
		}

		console.log(
			`[LOG]${CONSOLE_NAME} 最終合併的 env 為：\n`,
			resultEnv != null ? JSON.stringify(resultEnv, null, 2) : resultEnv,
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
