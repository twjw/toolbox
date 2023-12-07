import path from 'path'
import fs from 'fs'
import { isObject } from 'lodash-es'

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
	pages: string[] // 頁面目錄的絕對路徑
}

type ArrayKeyType<T extends object> = {
	[K in keyof T]: T[K] extends Array<any> ? K : never
}[keyof T]

const OUTLET = '(outlet)'
const META_NAME = 'page.meta.ts'
const PAGE_NAME = 'page.tsx'
let rid = 0
let mid = 0

function _getImportInfo(importPath: string, meta = false) {
	const result = {
		mid: null as null | string,
		metaImportString: null as null | string,
		lazyImportString: `import('${importPath}/${PAGE_NAME}')`,
	}

	if (meta) {
		result.mid = `m${++mid}`
		result.metaImportString = `import ${result.mid} from '${importPath}/${META_NAME}'`
	}

	return result
}

function _parameterReduce(p: string, e: string, i: number) {
	return p + (i > 0 ? `${(e[0] || '').toUpperCase()}${e.substring(1) || ''}` : e)
}

type GetFileRoutesArgs = {
	alias: string // 預設的 alias
	originDirPath: string // 預設的 pages 路徑
	dirPath?: string // 最新的 pages 路徑
	routePath?: string | null
	fullRoutePath?: string | null
	importPath?: string | null
	isParentOutlet?: boolean
	pages?: FileRoute[]
}

function _getFileRoutes({
	alias,
	originDirPath,
	dirPath = originDirPath,
	routePath = null,
	fullRoutePath = null,
	importPath = null,
	isParentOutlet = false,
	pages = [],
}: GetFileRoutesArgs) {
	try {
		const files = fs.readdirSync(dirPath)
		const hasOutlet = files.some(e => e === OUTLET)
		let hasMeta = files.some(e => e === META_NAME)

		files.forEach(file => {
			const filepath = path.join(dirPath, file)
			const lst = fs.lstatSync(filepath)
			let parentPath =
				routePath == null
					? dirPath.substring(originDirPath.length).replace(/\\/g, '/')
					: routePath
			let _importPath =
				importPath == null
					? `${alias}${dirPath.substring(originDirPath.length).replace(/\\/g, '/')}`
					: importPath
			let pfile =
				file
					.match(/^\[([A-z0-9-_]+)\]$/)?.[1]
					.split('-')
					.reduce(_parameterReduce, ':') || file

			if (lst.isDirectory()) {
				let page: FileRoute | undefined
				const isOutlet = pfile === OUTLET
				const layoutRoutePath = isOutlet
					? ''
					: isParentOutlet
					  ? pfile
					  : `${parentPath}/${pfile}`
				const layoutFullRoutePath =
					fullRoutePath != null
						? isOutlet
							? fullRoutePath
							: `${fullRoutePath}/${pfile}`
						: `${routePath || ''}/${pfile}`
				const layoutImportPath = `${_importPath}/${file}`

				if (isOutlet) {
					page = {
						filepath,
						routePath: parentPath || '/',
						fullRoutePath: layoutFullRoutePath,
						importPath: _importPath,
						layout: true,
						meta: false,
						children: [],
					}

					pages.push(page)
				}

				_getFileRoutes({
					alias: alias,
					originDirPath: originDirPath,
					dirPath: filepath,
					routePath: layoutRoutePath,
					fullRoutePath: layoutFullRoutePath,
					importPath: layoutImportPath,
					isParentOutlet: isOutlet,
					pages: page?.children || pages,
				})
			} else if (!hasOutlet) {
				let page: FileRoute | undefined

				if (new RegExp(`${PAGE_NAME}$`).test(file)) {
					const routePath = parentPath || '/'

					page = {
						filepath,
						routePath: routePath,
						fullRoutePath: fullRoutePath || routePath,
						importPath: _importPath,
						layout: false,
						meta: hasMeta,
						children: [],
					}
					pages.push(page)
				}
			}
		})
	} catch (err) {
		console.error(`err from _getFileRoutes`, err)
	}

	return pages
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
	lazyImportString: string,
) {
	return `${tab}<Route
${tab} key={'${rid}'}
${tab} path={'${fileRoute.routePath}'}
${tab} element={
${tab}   <context.Provider key={'${rid}'} value={{ path: '${fileRoute.fullRoutePath}', meta: ${
		mid || undefined
	} }}>
${tab}     <props.Wrap>
${tab}       {lazy(() => ${lazyImportString})}
${tab}     </props.Wrap>
${tab}   </context.Provider>
${tab} }`
}

// @prettier-ignore
function _transformRoutesTsxString(fileRoutes: FileRoute[], defaultMeta?: any) {
	let topImportString = `import { lazy, createContext, useContext, type FC, type ComponentType } from 'react'
import { Route } from 'react-router-dom'`

	let mainString = `type RoutesProps = {
  Wrap: FC<{ children: ComponentType }>
}

const context = createContext<any>(null)
// 要插入 defaultMeta 送到 meta === undefined 的地方裡

function useRoute() {
  return useContext(context)
}

function Routes(props: RoutesProps) {
  return [`

	let bottomExportString = `export {
  Routes,
  useRoute,
}`
	let resultString = ''

	mainString += '\n'

	for (let i = 0; i < fileRoutes.length; i++) {
		_recursiveObjTap(fileRoutes[i]!, 'children', (e, level, parent) => {
			const { mid, metaImportString, lazyImportString } = _getImportInfo(e.importPath, e.meta)
			const tab = ' ' + Array(level).fill('  ').join('')

			++rid
			if (mid) {
				topImportString += `\n${metaImportString}`
			}

			const commonRouteTsxString = _createCommonRouteTsxString(
				e,
				tab,
				String(rid),
				mid,
				lazyImportString,
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

	mainString += `  ]
}`
	resultString = `${topImportString}\n\n${mainString}\n\n${bottomExportString}`
	// console.log(JSON.stringify(fileRoutes, null, 2))

	fs.writeFileSync(path.resolve(__dirname, './result.tsx'), resultString)

	return mainString
}

// company
// const PROJECT_PATH = 'C:\\__c_frank\\codes\\side\\@twjw\\tmpl-react-spa'
// home
const PROJECT_PATH = 'C:\\_frank\\code\\@twjw\\tmpl-react-spa'
const BUILD_PATH = `${PROJECT_PATH}\\node_modules\\.wbtx-build`

function _getFlatRoutes(
	rootPath: string,
	dirPath = rootPath,
	isParentLayout = false,
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
				const fullRoutePath = filepath
					.substring(rootPath.length)
					.replace(
						new RegExp(`\\(${OUTLET.substring(1, OUTLET.length - 1)}\\)([\\\\\/]+)`, 'g'),
						'',
					)
					.replace(/\\/g, '/')
				node = routePathMap[fullRoutePath] = {
					filepath,
					routePath: `${isParentLayout}`,
					fullRoutePath: fullRoutePath.substring(
						0,
						fullRoutePath.length - PAGE_NAME.length - 1,
					),
					importPath: path.relative(BUILD_PATH, filepath).replace(/\\/g, '/'),
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
			_getFlatRoutes(rootPath, childDirPathList[i], hasOutlet, routePathMap)
		}
	} catch (error) {
		console.error(error)
	}

	return routePathMap
}

function run({ pages, defaultMeta }: RunOptions) {
	let flatRoutes: Record<string, { filepath: string; meta: boolean }> | undefined
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
	console.log(Object.values(flatRoutes!))
	return
	// 之後要改成 getBuildPath()
	const BUILD_PATH = `${PROJECT_PATH}\\node_modules\\.wbtx-build`
	// 之後要改成 path.resolve(process.cwd(), './src/pages')
	const PAGES_DIR_PATH = `${PROJECT_PATH}\\src\\pages`
	const SRC_ALIAS = path.relative(BUILD_PATH, PAGES_DIR_PATH).replace(/\\/g, '/')
	const fileRoutesList: FileRoute[][] = []

	for (let i = 0; i < pages.length; i++) {
		fileRoutesList.push(
			_getFileRoutes({
				alias: SRC_ALIAS,
				originDirPath: PAGES_DIR_PATH,
				dirPath: PAGES_DIR_PATH,
			}),
		)
	}

	console.log(fileRoutesList)
}

run({
	pages: [`${PROJECT_PATH}\\src\\pages`, `${PROJECT_PATH}\\src\\pages2`],
	defaultMeta: {
		title: 'hello world',
	},
})
