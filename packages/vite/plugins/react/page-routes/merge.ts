import path from 'path'
import fs from 'fs'

type SimpleFileRoute = {
	rootDir: string
	relateFiles: RouteRelateFiles
	children: Record<string, SimpleFileRoute>
}

type CompleteFileRoute = {
	filename: string
	rootDir: string
	parentPathList: string[]
	includesFile: {
		page: boolean
		meta: boolean
	}
	children: CompleteFileRoute[]
}

type RouteRelateFiles = [
	1 | undefined, // page
	1 | undefined, // meta
]

type MergeOptions = {
	dirs: string[] /* absolute path */
}

type RecursivePassSimpleFileRouteOptions = {
	routeMap: Record<string, SimpleFileRoute>
	dir: string
	rootDir: string
	parentDir?: string
}

const SL = path.normalize('/')
const PAGE_NAME = 'page.tsx'
const META_NAME = 'page.meta.ts'
const OUTLET_NAME = '(outlet)'
const PAGE_IDX = 0
const META_IDX = 1

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
	a: Record<string, SimpleFileRoute>,
	b: Record<string, SimpleFileRoute>,
): Record<string, SimpleFileRoute> {
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

function _convertToSimpleFileRouteMap(options: MergeOptions) {
	const simpleFileRouteMapList: Record<string, SimpleFileRoute>[] = Array.from(
		Array(options.dirs.length),
	).map(e => ({}))
	let resultSimpleFileRouteMap: Record<string, SimpleFileRoute> = {}

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

function _convertToCompleteFileRoutes(
	simpleFileRouteMap: Record<string, SimpleFileRoute>,
	parentPathList = [] as string[],
	result = [] as CompleteFileRoute[],
) {
	for (const k in simpleFileRouteMap) {
		const e = simpleFileRouteMap[k]

		if (e.relateFiles[PAGE_IDX] === 1) {
			const completeFileRoute: CompleteFileRoute = {
				filename: k,
				rootDir: e.rootDir,
				parentPathList: parentPathList,
				includesFile: {
					page: !!e.relateFiles[PAGE_IDX],
					meta: !!e.relateFiles[META_IDX],
				},
				children: [],
			}

			result.push(completeFileRoute)

			const outletName = `\\${OUTLET_NAME}`
			if (e.children[outletName] != null) {
				_convertToCompleteFileRoutes(
					e.children[outletName].children,
					parentPathList,
					completeFileRoute.children,
				)
				continue
			}
		}

		_convertToCompleteFileRoutes(e.children, [...parentPathList, k], result)
	}

	return result
}

function merge(options: MergeOptions) {
	const simpleFileRouteMap = _convertToSimpleFileRouteMap(options)
	const completeFileRoutes = _convertToCompleteFileRoutes(simpleFileRouteMap)

	return {
		simpleFileRouteMap,
		completeFileRoutes,
	}
}

export { PAGE_NAME, META_NAME, OUTLET_NAME, PAGE_IDX, META_IDX, merge }
