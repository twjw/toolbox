import fs from 'fs'
import { META_NAME, PAGE_NAME } from './constants'
import { SL } from '../../../../../general/constants'

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
	a: Record<string, FileRoute>,
	b: Record<string, FileRoute>,
): Record<string, FileRoute> {
	for (const k in b) {
		if (a[k] != null) {
			for (let i = 0; i < b[k].relateFiles.length; i++) {
				if (b[k].relateFiles[i] != null) {
					a[k].relateFiles[i] = b[k].relateFiles[i]
				}
			}
			_mergeSimpleFileRouteMap(a[k].children, b[k].children)
		} else {
			a[k] = b[k]
		}
	}

	return a
}

function mergeFiles(options: MergeOptions) {
	const simpleFileRouteMapList: Record<string, FileRoute>[] = Array.from(
		Array(options.dirs.length),
	).map(e => ({}))
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
		for (let i = 0; i < simpleFileRouteMapList.length - 1; i++) {
			resultSimpleFileRouteMap = _mergeSimpleFileRouteMap(
				simpleFileRouteMapList[i],
				simpleFileRouteMapList[i + 1],
			)
		}
	} else {
		resultSimpleFileRouteMap = simpleFileRouteMapList[0]
	}

	return resultSimpleFileRouteMap
}

export type { FileRoute }
export { mergeFiles }
