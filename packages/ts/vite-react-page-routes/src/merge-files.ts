import fs from 'fs'
import path from 'path'
import { META_NAME, PAGE_NAME } from './constants'

const SL = path.normalize('/')

type FileRoute = {
	relateFiles: RouteRelateFiles
	children: Record<string, FileRoute>
}

// number 為 rootDirIdx
type RouteRelateFiles = [
	number | undefined, // page
	number | undefined, // meta
]

type MergeOptions = {
	dirs: string[] /* absolute path */
}

type RecursivePassSimpleFileRouteOptions = {
	routeMap: Record<string, FileRoute>
	dir: string
	rootDir: string
	rootDirIdx: number
	parentDir?: string
}

function _recursivePassSimpleFileRoute({
	routeMap,
	dir,
	rootDir,
	rootDirIdx,
	parentDir,
}: RecursivePassSimpleFileRouteOptions) {
	const filenames = fs.readdirSync(dir, { withFileTypes: true })
	const nextDirs: string[] = []
	let hasPage = false
	let hasPageMeta = false

	for (let i = 0; i < filenames.length; i++) {
		const d = filenames[i]
		const fullFilepath = `${dir}${SL}${d.name}`

		if (d.isDirectory()) {
			nextDirs.push(fullFilepath)
		} else if (d.name === PAGE_NAME) {
			hasPage = true
		} else if (d.name === META_NAME) {
			hasPageMeta = true
		}
	}

	const shortDir = dir.substring((parentDir || rootDir).length) || SL
	routeMap[shortDir] = {
		relateFiles: [hasPage ? rootDirIdx : undefined, hasPageMeta ? rootDirIdx : undefined],
		children: {},
	}

	for (let i = 0; i < nextDirs.length; i++) {
		_recursivePassSimpleFileRoute({
			routeMap: routeMap[shortDir].children,
			dir: nextDirs[i],
			rootDir,
			rootDirIdx,
			parentDir: dir,
		})
	}
}

function _mergeSimpleFileRouteMap(
	result: Record<string, FileRoute>,
	current: Record<string, FileRoute>,
) {
	for (const path in current) {
		if (result[path] != null) {
			for (let i = 0; i < current[path].relateFiles.length; i++) {
				if (current[path].relateFiles[i] != null) {
					result[path].relateFiles[i] = current[path].relateFiles[i]
				}
			}
			if (!result[path].children) result[path].children = {}
			_mergeSimpleFileRouteMap(result[path].children, current[path].children)
		} else {
			result[path] = current[path]
		}
	}
}

function mergeFiles(options: MergeOptions) {
	const simpleFileRouteMapList: Record<string, FileRoute>[] = Array.from(
		Array(options.dirs.length),
	).map(() => ({}))
	let resultSimpleFileRouteMap: Record<string, FileRoute> = {}

	for (let i = 0; i < options.dirs.length; i++) {
		_recursivePassSimpleFileRoute({
			routeMap: simpleFileRouteMapList[i],
			dir: options.dirs[i],
			rootDir: options.dirs[i],
			rootDirIdx: i,
		})
	}

	if (simpleFileRouteMapList.length > 1) {
		for (let i = 0; i < simpleFileRouteMapList.length; i++) {
			_mergeSimpleFileRouteMap(resultSimpleFileRouteMap, simpleFileRouteMapList[i])
		}
	} else {
		resultSimpleFileRouteMap = simpleFileRouteMapList[0]
	}

	return resultSimpleFileRouteMap
}

export type { FileRoute }
export { mergeFiles }
