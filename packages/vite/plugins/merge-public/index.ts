import type { Plugin } from "vite";
import {log} from "../../../../utils/log.ts";
import path from "path";
import fs from "fs";

type MergePublicOptions = {
	distDir?: string
  publicDir?: string
	mergeDir?: string
  dirNames: string[]
}

const PLUGIN_NAME = 'merge-public'
const FULL_PLUGIN_NAME = `vite-plugin-wtbx-${PLUGIN_NAME}`

function mergePublic(options: MergePublicOptions): any {
	const { distDir = 'dist', publicDir = 'public', mergeDir = 'mp', dirNames } = options || {}
	const publicRootPath = path.resolve(process.cwd(), publicDir)
	const absDirs = dirNames.map(e => path.resolve(publicRootPath, e))
	let isBuild = false
	let buildPath = path.resolve(publicRootPath, mergeDir)

	const plugin: Plugin = {
		name: FULL_PLUGIN_NAME,
		enforce: 'pre',
		config(config) {
			isBuild = !!config.build

			if (isBuild) {
				buildPath = path.resolve(process.cwd(), distDir, mergeDir)
			}

			return {
				publicDir: isBuild ? false : publicDir,
			}
		},
		configResolved() {
			const exists = fs.existsSync(buildPath)

			if (exists) {
				fs.rmSync(buildPath, { recursive: true, force: true })
			} else {
				fs.mkdirSync(buildPath, { recursive: true })
			}

			for (let i = 0; i < absDirs.length; i++) {
				try {
					fs.cpSync(absDirs[i], buildPath, { recursive: true, force: true })
				} catch (err) {
					log.throw(err as Error, `找不到 ${publicDir}/${dirNames[i]} 目錄，無法合併資源`)
					process.exit(0)
				}
			}

			if (!isBuild) {
				const gitIgnorePath = path.resolve(buildPath, './.gitignore')
				fs.writeFileSync(gitIgnorePath, '*')
			}

			log.info(`已開啟靜態資源合併功能...`)
		},
		configureServer(server) {
			if (isBuild) return

			function onEvent(type: 'unlink' | 'other') {
				return (filepath: string) => {
					if (!filepath.includes(publicRootPath)) return

					const firstWordReg = /^[\/\\]([A-z0-9_-]+)[\/\\]/
					const noRootFilepath = filepath.substring(publicRootPath.length)
					const fileDir = noRootFilepath.match(firstWordReg)?.[1]
					const dirIdx = dirNames.findIndex(e => e === fileDir)

					if (dirIdx === -1) return

					const noDirFilepath = noRootFilepath.replace(firstWordReg, '')

					if (type === 'unlink') {
						if (dirIdx === 0) {
							fs.rmSync(path.resolve(buildPath, noDirFilepath))
							return
						}

						for (let i = dirIdx - 1; i >= 0; i--) {
							const dirFilepath = path.resolve(publicRootPath, dirNames[i], noDirFilepath)
							const exists = fs.existsSync(dirFilepath)

							if (exists) {
								fs.copyFileSync(dirFilepath, path.resolve(buildPath, noDirFilepath))
								break
							} else if (i === 0) {
								fs.rmSync(path.resolve(buildPath, noDirFilepath))
							}
						}
					} else {
						for (let i = dirNames.length - 1; i >= 0; i--) {
							const exists = fs.existsSync(path.resolve(publicRootPath, dirNames[i], noDirFilepath))

							if (exists) {
								if (dirIdx < i) break

								fs.copyFileSync(filepath, path.resolve(buildPath, noDirFilepath))
								break
							} else if (i === 0) {
								fs.copyFileSync(filepath, path.resolve(buildPath, noDirFilepath))
							}
						}
					}
				}
      }

			server.watcher.on('change', onEvent('other'))
			server.watcher.on('add', onEvent('other'))
			server.watcher.on('unlink', onEvent('unlink'))
		},
	}

	return plugin
}

export type {
  MergePublicOptions,
}

export {
  mergePublic,
}
