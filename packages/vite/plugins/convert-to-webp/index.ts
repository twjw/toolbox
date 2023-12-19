import type { Plugin } from "vite";
import sharp, {WebpOptions} from 'sharp'
import path from "path";
import fs from "fs";
import {log} from "../../../../utils/log.ts";

type ConvertToWebpOptions = {
  convertRemove?: boolean // 是否再轉換後移除原圖
  dirs: string[] // 要轉換的目錄
  extensionReg?: RegExp // 需要轉換的圖檔正則
  force?: boolean // 是否強制轉換
  buildDirname?: string // 有這參數就會統一生成在跟目錄的該檔名
  webpOptions?: WebpOptions
}

const PLUGIN_NAME = 'convert-to-webp'
const FULL_PLUGIN_NAME = `vite-plugin-wtbx-${PLUGIN_NAME}`
const SL = path.normalize('/')

function _convertToBuildDirPath (rootDirPath: string, filepath: string, buildDirname: string) {
  return `${filepath.substring(0, rootDirPath.length)}${SL}${buildDirname}${filepath.substring(rootDirPath.length)}`
}

async function _convert (rootDirPath: string, noExtFilepath: string, ext: string, options: ConvertToWebpOptions) {
  const toPath = options.buildDirname
    ? _convertToBuildDirPath(rootDirPath, `${noExtFilepath}.webp`, options.buildDirname)
    : `${noExtFilepath}.webp`

  _checkMkdir(toPath, options)
  await sharp(`${noExtFilepath}.${ext}`)
    .webp(options.webpOptions)
    .toFile(toPath)

  if (options.convertRemove) {
    fs.rmSync(`${noExtFilepath}.${ext}`)
  }
}

async function _recursiveConvert (rootDirPath: string, dirPath: string, options: ConvertToWebpOptions) {
  const dirs = fs.readdirSync(dirPath, { withFileTypes: true })
  const fileMap = dirs.reduce((p, e) => (p[e.name] = e.isDirectory(), p), {} as Record<string, boolean>)

  for (const filename in fileMap) {
    const isDirectory = fileMap[filename]

    if (isDirectory) {
      await _recursiveConvert(rootDirPath, path.resolve(dirPath, filename), options)
    } else {
      const [, noExtFilename, ext] = filename.match(/^(.*)\.([^.]+)$/) || []

      if (options.extensionReg!.test(filename)) {
        const convert = () => _convert(rootDirPath, path.resolve(dirPath, noExtFilename), ext, options)
        if (options.force) {
          await convert()
        } else if (options.buildDirname) {
          if (
						!fs.existsSync(
							_convertToBuildDirPath(rootDirPath, `${dirPath}${SL}${noExtFilename}.webp`, options.buildDirname),
						)
					) {
						await convert()
					}
        } else if (fileMap[`${noExtFilename}.webp`] == null) {
          await convert()
        }
      }
    }
  }
}

async function _startConvert (options: ConvertToWebpOptions) {
  for (let i = 0; i < options.dirs.length; i++) {
    await _recursiveConvert(options.dirs[i], options.dirs[i], options)
  }
}

function _checkMkdir (filepath: string, options: ConvertToWebpOptions) {
  if (!options.buildDirname) return

  const [, dirPath, noExtFilename, ext] = _findFileInfoByFilepath(filepath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {recursive: true})
  }
}

function _findFileInfoByFilepath (filepath: string) {
  return filepath.match(/(.+)[\\\/]+([^.]+)\.([^.]+)$/) || []
}

function _checkWebpExistsByWatcherServer (options: ConvertToWebpOptions, rootDirPath: string, dirPath: string, noExtFilename: string) {
  if (options.buildDirname)
    return fs.existsSync(
    _convertToBuildDirPath(rootDirPath, `${dirPath}${SL}${noExtFilename}.webp`, options.buildDirname),
  )

  return fs.existsSync(`${noExtFilename}.webp`)
}

function convertToWebp(options: ConvertToWebpOptions): any {
  if (options.convertRemove == null) options.convertRemove = true
  if (options.extensionReg == null) options.extensionReg = /\.(jpe?g|png)$/i

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
    enforce: 'pre',
    async config() {
      await _startConvert(options)
      log.info(`已開啟圖片轉換為 webp 功能...`)
    },
    async configureServer(server) {
      function getDirIdx (filepath: string) {
        if (!options.extensionReg!.test(filepath)) return -1

        for (let i = 0; i < options.dirs.length; i++) {
          const [s1, s2] = filepath.split(options.dirs[i])
          if (s1 === '' && s2[0] === SL) return i
        }

        return -1
      }

      server.watcher.on('add', async (filepath) => {
        const dirIdx = getDirIdx(filepath)
        if (dirIdx === -1) return

        const [, dirPath, noExtFilename, ext] = _findFileInfoByFilepath(filepath)

        await _convert(options.dirs[dirIdx], path.resolve(dirPath, noExtFilename), ext, options)
      })

      server.watcher.on('change', async (filepath) => {
        const dirIdx = getDirIdx(filepath)
        if (dirIdx === -1) return

        const [, dirPath, noExtFilename, ext] = _findFileInfoByFilepath(filepath)
        const noExtFilepath = path.resolve(dirPath, noExtFilename)

        await _convert(options.dirs[dirIdx], noExtFilepath, ext, options)
      })
    }
	}

	return plugin
}

export type {
  ConvertToWebpOptions,
}

export {
  convertToWebp,
}
