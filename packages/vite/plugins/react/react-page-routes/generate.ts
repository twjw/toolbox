import path from 'path'
import fs from 'fs'
import { isObject } from 'lodash-es'
import {getBuildPath} from "../../../../../utils/node/build-path.ts";
import {log} from "../../../../../utils/log.ts";

type FileRoute = {
	filepath: string
	routePath: string // 子路由前面不會有父路由
	fullRoutePath: string // 完整的路由
	importPath: string // ex. @/pages/example
	layout: boolean // 是否是 (outlet)
	meta: boolean // 是否有 meta
	children: FileRoute[]
}

type RunOptions = {
	defaultMeta?: any // 預設的 meta 資料
	pages: string[] // 頁面目錄的絕對路徑(後蓋前)
}

type ArrayKeyType<T extends object> = {
	[K in keyof T]: T[K] extends Array<any> ? K : never
}[keyof T]

const OUTLET = '(outlet)'
const META_NAME = 'page.meta.ts'
const PAGE_NAME = 'page.tsx'
const ids = {
	r: 0, // route key
	m: 0, // meta
	l: 0, // lazy component
}

function _getImportInfo(importPath: string, meta = false) {
	const lcId = `LC${++ids.l}`
	const result = {
		mid: null as null | string,
		metaImportString: null as null | string,
		lid: lcId,
		lazyImportString: `const ${lcId} = lazy(() => import('${importPath}/${PAGE_NAME}'))`,
	}

	if (meta) {
		result.mid = `m${++ids.m}`
		result.metaImportString = `import ${result.mid} from '${importPath}/${META_NAME}'`
	}

	return result
}

function _recursiveObjTap<T extends object>(
	obj: T,
	key: ArrayKeyType<T>,
	tap: (e: T, level: number, parent: T | null) => (() => void) | void,
	level = 1,
	parent = null as T | null,
) {
	const el = obj[key] as any[]

	const end = tap(obj, level, parent)

	for (let i = 0; i < (el as T[]).length; i++) {
		const el2 = el[i] as T

		if (isObject(el2)) {
			_recursiveObjTap(el2, key, tap, level + 1, obj)
		}
	}

	end?.()
}

function _createCommonRouteTsxString(
	fileRoute: FileRoute,
	tab: string,
	rid: string,
	mid: string | null,
	LC: string,
) {
	return `${tab}<Route
${tab} key={'${rid}'}
${tab} path={'${fileRoute.routePath}'}
${tab} element={
${tab}   <context.Provider key={'${rid}'} value={{ path: '${fileRoute.fullRoutePath}', meta: ${
		mid || undefined || 'defaultMeta'
	} }}>
${tab}     <props.Wrap>
${tab}       <${LC} />
${tab}     </props.Wrap>
${tab}   </context.Provider>
${tab} }`
}

// @prettier-ignore
function _generateRoutesTsxString(fileRoutes: FileRoute[], defaultMeta?: any) {
	let topImportString = `import { lazy, createContext, useContext, type FC, type ComponentType } from 'react'
import { Route } from 'react-router-dom'`

	let topLazyImportString = ''

	let mainString = `type PageRoutesProps = {
  Wrap: FC<{ children: Element }>
}

const defaultMeta = ${JSON.stringify(defaultMeta, null, 2)}

const context = createContext<any>(null)

function usePageRoute() {
  return useContext(context)
}

function createPageRoutes(props: PageRoutesProps) {
  return <>`

	let bottomExportString = `export {
  createPageRoutes,
  usePageRoute,
}`
	let resultString = ''

	mainString += '\n'

	for (let i = 0; i < fileRoutes.length; i++) {
		_recursiveObjTap(fileRoutes[i]!, 'children', (e, level, parent) => {
			const { mid, metaImportString, lid, lazyImportString } = _getImportInfo(e.importPath, e.meta)
			const tab = ' ' + Array(level).fill('  ').join('')

			ids.r++
			if (mid) {
				topImportString += `\n${metaImportString}`
			}

			topLazyImportString += `\n${lazyImportString}`

			const commonRouteTsxString = _createCommonRouteTsxString(
				e,
				tab,
				String(ids.r),
				mid,
				lid,
			)

			if (e.layout) {
				mainString += `${parent?.layout ? '\n' : ''}${commonRouteTsxString}
${tab}>`

				return () => {
					mainString += `
${tab}</Route>${parent?.layout ? '' : ',\n'}`
				}
			} else {
				mainString += `${parent?.layout ? '\n' : ''}${commonRouteTsxString}
${tab}/>${parent?.layout ? '' : ',\n'}`
			}
		})
	}

	mainString += `  </>
}`
	resultString = `${topImportString}\n${topLazyImportString}\n\n${mainString}\n\n${bottomExportString}`

	// console.log(JSON.stringify(fileRoutes, null, 2))
	// fs.writeFileSync(path.resolve(getBuildPath(), `./${RESULT_FILENAME}`), resultString)

	log.info('react-page-routes 已創建或更新')
	for (let k in ids) {
		ids[k as keyof typeof ids] = 0
	}

	return resultString
}

function _changeRouteParameter (routePath: string) {
	return routePath.replace(/\[([^\]]+)\]/g, function(_, key) {
		return `:${key}`.replace(/-([a-z])/g, function (_, letter: string) {
			return letter.toUpperCase()
		})
	});
}

function _getFlatRoutes(
	rootPath: string,
	dirPath = rootPath,
	// Record<fullRoutePath, filepath>
	routePathMap: Record<string, FileRoute> = {},
): Record<string, FileRoute> {
	try {
		const files = fs.readdirSync(dirPath)
		const childDirPathList = [] as string[]
		let node: FileRoute,
			hasOutlet = false,
			hasMeta = false

		files.forEach((file, i) => {
			const filepath = path.resolve(dirPath, file)
			const stas = fs.lstatSync(filepath)

			if (stas.isDirectory()) {
				childDirPathList.push(filepath)

				if (file === OUTLET) {
					if (node != null) {
						node.layout = true
					} else {
						hasOutlet = true
					}
				}
			} else if (file === PAGE_NAME) {
				// /完整路由/page.tsx
				const fullRoutePagePath = _changeRouteParameter(
					filepath
						.substring(rootPath.length)
						.replace(
							new RegExp(`\\(${OUTLET.substring(1, OUTLET.length - 1)}\\)([\\\\\/]+)`, 'g'),
							'',
						)
						.replace(/\\/g, '/')
				)
				// /完整路由
				const fullRoutePath = fullRoutePagePath.substring(
					0,
					fullRoutePagePath.length - PAGE_NAME.length - 1,
				) || '/'
				const relativeFilepath = `./${path.relative(process.cwd(), filepath)}`
				const importPath = relativeFilepath.substring(0,
					relativeFilepath.length - PAGE_NAME.length - 1,).replace(/\\/g, '/')
				node = routePathMap[fullRoutePagePath] = {
					filepath,
					routePath: fullRoutePath, // 後續轉物件塞進去
					fullRoutePath,
					importPath,
					layout: hasOutlet,
					meta: hasMeta,
					children: [],
				}
			} else if (file === META_NAME) {
				if (node != null) {
					node.meta = true
				} else {
					hasMeta = true
				}
			}
		})

		for (let i = 0; i < childDirPathList.length; i++) {
			_getFlatRoutes(rootPath, childDirPathList[i], routePathMap)
		}
	} catch (error) {
		console.error(error)
	}

	return routePathMap
}



function _toRecordRoutes (flatRouteList: FileRoute[], parentFullRoutePath?: string, resultRoutes: FileRoute[] = []) {
	const rangeIdxesList = [] as number[][]

	for (let i = 0; i < flatRouteList.length; i++) {
		const routeInfo = flatRouteList[i]
		const rangeIdxes = [i] as number[]

		if (parentFullRoutePath != null) {
			routeInfo.routePath = routeInfo.routePath.substring(parentFullRoutePath.length + 1)
		}

		if (routeInfo.layout) {
			for (let j = i + 1; j < flatRouteList.length; j++) {
				if (!new RegExp(`^${routeInfo.fullRoutePath}`).test(flatRouteList[j].fullRoutePath)) {
					rangeIdxes.push(j - 1)
					break
				}
			}

			if (rangeIdxes[1]) {
				i = rangeIdxes[1]
			}
		}

		rangeIdxesList.push(rangeIdxes)
	}

	for (let i = 0; i < rangeIdxesList.length; i++) {
		const [from, to] = rangeIdxesList[i]

		if (to != null) {
			const route = flatRouteList[from]
			const childFlatRouteList = flatRouteList.slice(from + 1, to + 1)
			resultRoutes.push(route)
			route.children = _toRecordRoutes(childFlatRouteList, route.fullRoutePath, [])
		} else {
			resultRoutes.push(flatRouteList[from])
		}
	}

	return resultRoutes
}

function generate({ pages, defaultMeta }: RunOptions) {
	let flatRoutes: Record<string, FileRoute> | undefined

	for (let i = 0; i < pages.length; i++) {
		if (flatRoutes == null) {
			flatRoutes = _getFlatRoutes(pages[i])
		} else {
			const nextFlatRoutes = _getFlatRoutes(pages[i])
			for (let fullRoutePath in nextFlatRoutes) {
				if (flatRoutes[fullRoutePath] != null) {
					flatRoutes[fullRoutePath] = nextFlatRoutes[fullRoutePath]
				}
			}
		}
	}

	const resultRoutes = _toRecordRoutes(Object.values(flatRoutes!))
	return _generateRoutesTsxString(resultRoutes, defaultMeta)
}

export type {
	RunOptions
}

export {
	OUTLET,
	META_NAME,
	PAGE_NAME,
	generate,
}
