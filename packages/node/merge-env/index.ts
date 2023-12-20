import fs from 'fs'
import { SL } from '../../../constants'
import { isArray, isObject, merge } from 'lodash-es'
import { log } from '../../../utils/log.ts'
import { importDynamicTs } from '../../../utils/node/import-dynamic-ts.ts'

type MergeEnvOptions = {
	mode?: string // 環境變數
	dirs: string[] // absolute path
}

async function mergeEnv <Env = undefined>(options: MergeEnvOptions): Promise<Env> {
  try {
    if (options.mode == null) options.mode = 'development'

    // .env -> .env.local -> .env.[mode] -> .env.[mode].local
    const envIdxMap = {
      '.env.ts': 0,
      '.env.local.ts': 1,
      [`.env.${options.mode}.ts`]: 2,
      [`.env.${options.mode}.local.ts`]: 3,
    }
    let resultEnv = undefined as Env

    for (let i = 0; i < options.dirs.length; i++) {
      if (!fs.existsSync(options.dirs[i])) continue

      const envList: Env[] = Array(4).fill(undefined)
      const filenames = fs.readdirSync(options.dirs[i], {withFileTypes: true})

      for (let j = 0; j < filenames.length; j++) {
        const lstat = filenames[j]
        if (lstat.isFile()) {
          const envIdx = envIdxMap[lstat.name]
          if (envIdx != null) {
            envList[envIdx] = (await importDynamicTs(`${options.dirs[i]}${SL}${lstat.name}`)).default
          }
        }
      }

      for (let j = 0; j < envList.length; j++) {
        const env = envList[j];

        if (env != null) {
          if (isObject(env)) {
            resultEnv = merge(resultEnv || {}, env)
          } else if (isArray(env)) {
            resultEnv = merge(resultEnv || [], env)
          } else {
            resultEnv = env
          }
        }
      }
    }

    return resultEnv
  } catch (error) {
    log.error('wtbx/node mergeEnv ERROR')
    log.error(error as Error)
    process.exit(0)
  }
}

export type {
  MergeEnvOptions
}
export {
  mergeEnv
}
