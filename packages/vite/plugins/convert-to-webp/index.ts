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
  webpOptions?: WebpOptions
}

const PLUGIN_NAME = 'convert-to-webp'
const FULL_PLUGIN_NAME = `vite-plugin-wtbx-${PLUGIN_NAME}`

async function _convert (filepath: string, ext: string, options: ConvertToWebpOptions) {
  await sharp(`${filepath}.${ext}`)
    .webp(options.webpOptions)
    .toFile(`${filepath}.webp`)

  if (options.convertRemove) {
    fs.rmSync(`${filepath}.${ext}`)
  }
}

async function _recursiveConvert (filepath: string, options: ConvertToWebpOptions) {
  const dirs = fs.readdirSync(filepath, { withFileTypes: true })
  const fileMap = dirs.reduce((p, e) => (p[e.name] = e.isDirectory(), p), {} as Record<string, boolean>)

  for (const filename in fileMap) {
    const isDirectory = fileMap[filename]

    if (isDirectory) {
      await _recursiveConvert(path.resolve(filepath, filename), options)
    } else {
      const [, noExtFilename, ext] = filename.match(/^(.*)\.([^.]+)$/) || []

      if (options.extensionReg!.test(filename) && (options.force || fileMap[`${noExtFilename}.webp`] == null)) {
        await _convert(path.resolve(filepath, noExtFilename), ext, options)
      }
    }
  }
}

async function _startConvert (options: ConvertToWebpOptions) {
  for (let i = 0; i < options.dirs.length; i++) {
    await _recursiveConvert(options.dirs[i], options)
  }
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
      function _checkIncludes (filepath: string) {
        return options.dirs.some(dirpath => filepath.includes(dirpath)) && options.extensionReg!.test(filepath)
      }

      server.watcher.on('add', async (filepath) => {
        if (!_checkIncludes(filepath)) return

        const [, dirpath, noExtFilename, ext] = filepath.match(/(.+)[\\\/]+([^.]+)\.([^.]+)$/) || []

        if (!fs.existsSync(`${noExtFilename}.webp`)) {
          await _convert(path.resolve(dirpath, noExtFilename), ext, options)
        }
      })

      server.watcher.on('change', async (filepath) => {
        if (!_checkIncludes(filepath)) return

        const [, dirpath, noExtFilename, ext] = filepath.match(/(.+)[\\\/]+([^.]+)\.([^.]+)$/) || []
        const noExtFilepath = path.resolve(dirpath, noExtFilename)

        if (fs.existsSync(`${noExtFilename}.webp`))
          fs.rmSync(`${noExtFilepath}.${ext}`)

        await _convert(noExtFilepath, ext, options)
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
