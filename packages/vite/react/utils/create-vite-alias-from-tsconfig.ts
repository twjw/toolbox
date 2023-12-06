import path from 'path'
import { log } from '../../../../utils/log'
import fs from 'fs/promises'
import jsonc from 'jsonc-parser'

async function getIdeaPaths(filename: string, filepath: string) {
  try {
    const text = await fs.readFile(filepath, { encoding: 'utf8' })
    const paths = jsonc.parse(text)?.compilerOptions?.paths || {}
    const dirReg = /\/\*$/
    const result = {} as Record<string, any>

    for (const k in paths) {
      result[(k as string).replace(dirReg, '')] = `/${paths[k][0].replace(dirReg, '')}`
    }

    return result
  } catch (error) {
    log.error(error, `\n解析 ${filename} 失敗，取消該檔自動 alias`)
    return {}
  }
}

async function createViteAliasFromTsconfig(options?: { filename?: string, filepath?: string/* absolute path */ }): Promise<Record<string, any>> {
  const { filename = 'tsconfig.json', filepath = path.resolve(process.cwd(), `./${filename}`) } = options || {}
  const alias = await getIdeaPaths(filename, filepath)

  log.info(`通過 ${filename} 生成的 alias:`)
  log.info(alias)

  return alias
}

export { createViteAliasFromTsconfig }
