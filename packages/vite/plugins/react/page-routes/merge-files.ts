import fs from 'fs'
import {META_NAME, PAGE_IDX, PAGE_NAME} from "./constants.ts";
import {SL} from "../../../../../constants";

type FileRoute = {
	rootDir: string
	relateFiles: RouteRelateFiles
	children: Record<string, FileRoute>
}

type RouteRelateFiles = [
	1 | undefined, // page
	1 | undefined, // meta
]

type MergeOptions = {
	dirs: string[] /* absolute path */
}

type RecursivePassSimpleFileRouteOptions = {
	routeMap: Record<string, FileRoute>
	dir: string
	rootDir: string
	parentDir?: string
}

function _recursivePassSimpleFileRoute({
	routeMap,
	dir,
	rootDir,
	parentDir,
}: RecursivePassSimpleFileRouteOptions) {
	const filenames = fs.readdirSync(dir, { withFileTypes: true })
	const nextDirs: string[] = []
	let hasPage = undefined as 1 | undefined
	let hasPageMeta = undefined as 1 | undefined

	for (let i = 0; i < filenames.length; i++) {
		const d = filenames[i]
		const fullFilepath = `${dir}${SL}${d.name}`

		if (d.isDirectory()) {
			nextDirs.push(fullFilepath)
		} else if (d.name === PAGE_NAME) {
			hasPage = 1
		} else if (d.name === META_NAME) {
			hasPageMeta = 1
		}
	}

	const shortDir = dir.substring((parentDir || rootDir).length) || SL
	routeMap[shortDir] = {
		rootDir,
		relateFiles: [hasPage, hasPageMeta],
		children: {},
	}

	for (let i = 0; i < nextDirs.length; i++) {
		_recursivePassSimpleFileRoute({
			routeMap: routeMap[shortDir].children,
			dir: nextDirs[i],
			rootDir,
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
			if (b[k].relateFiles[PAGE_IDX] === 1) {
				a[k].rootDir = b[k].rootDir
				for (let i = 0; i < b[k].relateFiles.length; i++) {
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
