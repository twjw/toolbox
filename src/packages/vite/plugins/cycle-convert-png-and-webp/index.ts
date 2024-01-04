import type { Plugin } from 'vite'
import fs from 'fs'
import { PACKAGE_NAME, SL } from '../../../../general/constants'
import sharp from 'sharp'

type CycleConvertPngAndWebpOptions = {
	dirs: string[] // 要轉換的目錄(absolute path)
}

type SupportExt = 'png' | 'webp'

const PLUGIN_NAME = 'cycle-convert-png-and-webp'
const FULL_PLUGIN_NAME = `vite-plugin-${PACKAGE_NAME}-${PLUGIN_NAME}`
const CONSOLE_NAME = `[${PACKAGE_NAME}-${PLUGIN_NAME}]`

async function _convert(options: CycleConvertPngAndWebpOptions) {
	for (let i = 0; i < options.dirs.length; i++) {
		const dir = options.dirs[i]
		const filenames = await fs.promises.readdir(dir)
		let hasWebpDir = false
		let hasPngDir = false

		for (let j = 0; j < filenames.length; j++) {
			const filename = filenames[j]

			if (filename === 'webp') {
				hasWebpDir = true
			} else if (filename === 'png') {
				hasPngDir = true
			}

			if (hasWebpDir && hasPngDir) break
		}

		const pngDirPath = `${dir}${SL}png`
		const webpDirPath = `${dir}${SL}webp`
		const relativeFilepathExistsMap: Record<string, 1> = {}

		if (!hasPngDir) await fs.promises.mkdir(pngDirPath)
		if (!hasWebpDir) await fs.promises.mkdir(webpDirPath)

		await _recursiveFindPicDir('png', dir, relativeFilepathExistsMap, pngDirPath)
		await _recursiveFindPicDir('webp', dir, relativeFilepathExistsMap, webpDirPath)
	}
}

async function _recursiveFindPicDir(
	ext: SupportExt,
	rootDirPath: string,
	relativeFilepathExistsMap: Record<string, 1>,
	dirPath: string,
) {
	const lstatList = await fs.promises.readdir(dirPath, { withFileTypes: true })

	for (let i = 0; i < lstatList.length; i++) {
		const lstat = lstatList[i]
		const filepath = `${dirPath}${SL}${lstat.name}`
		const [, noExtFilename, fileExt] = (lstat.name.match(new RegExp(`(.+)\\.(.+)$`)) || []) as (
			| string
			| undefined
		)[]

		if (lstat.isDirectory()) {
			await _recursiveFindPicDir(ext, rootDirPath, relativeFilepathExistsMap, filepath)
		} else if (fileExt != null && fileExt === ext) {
			const relativeFilepath = filepath.substring(rootDirPath.length)

			if (relativeFilepathExistsMap[relativeFilepath] == null) {
				relativeFilepathExistsMap[relativeFilepath] = 1
				await _checkCreateAnotherPic(ext, rootDirPath, dirPath, noExtFilename!)
			}
		}
	}
}

function _getPathInfo(
	ext: SupportExt,
	rootDirPath: string,
	dirPath: string,
	noExtFilename: string,
) {
	const anotherExt = ext === 'png' ? 'webp' : 'png'
	const anotherDirPath = `${rootDirPath}${SL}${anotherExt}${dirPath.substring(
		rootDirPath.length + ext.length + 1,
	)}`
	const anotherFilepath = `${anotherDirPath}${SL}${noExtFilename}.${anotherExt}`
	const selfDirPath = `${rootDirPath}${SL}${ext}`
	const selfFilepath = `${dirPath}${SL}${noExtFilename}.${ext}`

	return {
		another: {
			ext: anotherExt,
			dirPath: anotherDirPath,
			filepath: anotherFilepath,
		},
		self: {
			ext,
			dirPath: selfDirPath,
			filepath: selfFilepath,
		},
	}
}

async function _checkCreateAnotherPic(
	ext: SupportExt,
	rootDirPath: string,
	dirPath: string,
	noExtFilename: string,
) {
	const { another, self } = _getPathInfo(ext, rootDirPath, dirPath, noExtFilename)

	if (another.dirPath.length !== self.dirPath.length) {
		try {
			await fs.promises.access(another.dirPath)
		} catch {
			await fs.promises.mkdir(another.dirPath, { recursive: true })
		}
	}

	try {
		await fs.promises.access(another.filepath)
	} catch {
		if (ext === 'png') {
			await sharp(self.filepath).webp().toFile(another.filepath)
		} else {
			await sharp(self.filepath).toFormat('png').toFile(another.filepath)
		}
	}
}

function _getRootDirPath(options: CycleConvertPngAndWebpOptions, filepath: string) {
	if (!/\.(png|webp)$/.test(filepath)) return null

	for (let i = 0; i < options.dirs.length; i++) {
		const dir = options.dirs[i]
		const [s1, s2] = filepath.split(dir)
		if (s1 === '' && s2[0] === SL) return dir
	}

	return null
}

function _onUpdate(options: CycleConvertPngAndWebpOptions) {
	return async (filepath: string) => {
		const pathInfoParameters = _getPathInfoParameters(options, filepath)
		if (pathInfoParameters == null) return

		await _checkCreateAnotherPic(...pathInfoParameters)
	}
}

function _getPathInfoParameters(options: CycleConvertPngAndWebpOptions, filepath: string) {
	const rootDirPath = _getRootDirPath(options, filepath)
	if (rootDirPath == null) return rootDirPath

	const filename = filepath.match(/[\\\/]([^\\\/]+)$/)?.[1]!
	const [, noExtFilename, fileExt] = (filename.match(new RegExp(`(.+)\\.(.+)$`)) || []) as (
		| string
		| undefined
	)[]

	return [
		fileExt as SupportExt,
		rootDirPath,
		filepath.substring(0, filepath.length - filename.length - 1),
		noExtFilename!,
	] as const
}

function cycleConvertPngAndWebp(options: CycleConvertPngAndWebpOptions): any {
	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		async config() {
			await _convert(options)
			console.log(`[LOG]${CONSOLE_NAME} 已開啟 png ⇆ webp 圖片轉換功能...`)
		},
		async configureServer(server) {
			server.watcher.on('add', _onUpdate(options))
			server.watcher.on('change', _onUpdate(options))
			server.watcher.on('unlink', async filepath => {
				const pathInfoParameters = _getPathInfoParameters(options, filepath)
				if (pathInfoParameters == null) return

				const { another, self } = _getPathInfo(...pathInfoParameters)

				try {
					await fs.promises.access(another.filepath)
					await fs.promises.rm(another.filepath)
				} catch {}
			})
		},
	}

	return plugin
}

export type { CycleConvertPngAndWebpOptions }

export { cycleConvertPngAndWebp }
