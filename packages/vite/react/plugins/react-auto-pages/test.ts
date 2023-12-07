import path from 'path'
import fs from 'fs'
import {isObject} from "lodash-es";

type FileRoute = {
  filepath: string
  routePath: string // ex. /example | /
  fullRoutePath: string //
  importPath: string // ex. @/pages/example
  layout: boolean // 是否是 (outlet)
  meta: boolean // 是否有 meta
  children: FileRoute[]
}

type ArrayKeyType<T extends object> = {
  [K in keyof T]: T[K] extends Array<any> ? K : never;
}[keyof T];

const OUTLET = '(outlet)'
const META_NAME = 'page.meta.ts'
const PAGE_NAME = 'page.tsx'
const PAGES_DIR_PATH = 'C:\\__c_frank\\codes\\side\\@twjw\\tmpl-react-spa\\src\\pages'
const LAST_WORD_REG = /[^\/\\]+$/
const PAGES_DIR_NAME = PAGES_DIR_PATH.match(LAST_WORD_REG)![0]
const SRC_ALIAS = `@/${PAGES_DIR_NAME}`
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

function _parameterReduce (p: string, e: string, i: number) {
  return p + (i > 0 ? `${(e[0] || '').toUpperCase()}${e.substring(1) || ''}` : e)
}

function _getFileRoutes (
  dirPath = PAGES_DIR_PATH,
  routePath: string | null = null,
  fullRoutePath: string | null = null,
  importPath: string | null = null,
  isParentOutlet = false,
  pages: FileRoute[] = [],
) {
  try {
    const files = fs.readdirSync(dirPath)
    const hasOutlet = files.some(e => e === OUTLET)
    let hasMeta = files.some(e => e === META_NAME)

    files.forEach(file => {
      const filepath = path.join(dirPath, file)
      const lst = fs.lstatSync(filepath)
      let parentPath = routePath == null ? dirPath.substring(PAGES_DIR_PATH.length).replace(/\\/g, '/') : routePath
      let _importPath = importPath == null ? `${SRC_ALIAS}${dirPath.substring(PAGES_DIR_PATH.length).replace(/\\/g, '/')}` : importPath
      let pfile = file.match(/^\[([A-z0-9-_]+)\]$/)?.[1]
        .split('-')
        .reduce(_parameterReduce, ':') || file

      if (lst.isDirectory()) {
        let page: FileRoute | undefined
        const isOutlet = pfile === OUTLET
        const layoutRoutePath = isOutlet ? '' : isParentOutlet ? pfile : `${parentPath}/${pfile}`
        const layoutFullRoutePath = fullRoutePath != null
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

        _getFileRoutes(
          filepath,
          layoutRoutePath,
          layoutFullRoutePath,
          layoutImportPath,
          isOutlet,
          page?.children || pages
        )
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

function _recursiveObjTap<T extends object>(obj: T, key: ArrayKeyType<T>, tap: (e: T, level: number, parent: T | null) => (() => void) | void, level = 1, parent = null as T | null) {
  const el = obj[key] as any[];

  const end = tap(obj, level, parent)

  for (let i = 0; i < (el as T[]).length; i++) {
    const el2 = el[i] as T;

    if (isObject(el2)) {
      _recursiveObjTap(el2, key, tap, level + 1, obj)
    }
  }

  end?.()
}

function _createCommonRouteTsxString (fileRoute: FileRoute, tab: string, rid: string, mid: string | null, lazyImportString: string) {
  return `${tab}<Route
${tab} key={'${rid}'}
${tab} path={'${fileRoute.routePath}'}
${tab} element={
${tab}   <context.Provider key={'${rid}'} value={{ path: '${fileRoute.fullRoutePath}', meta: ${mid || undefined} }}>
${tab}     <props.Wrap>
${tab}       {lazy(() => ${lazyImportString})}
${tab}     </props.Wrap>
${tab}   </context.Provider>
${tab} }`
}

// @prettier-ignore
function _transformRoutesTsxString() {
  const fileRoutes = _getFileRoutes()
  let topImportString =
`import { lazy, createContext, useContext, type FC, type ComponentType } from 'react'
import { Route } from 'react-router-dom'`

  let mainString =
`type RoutesProps = {
  Wrap: FC<{ children: ComponentType }>
}

const context = createContext<any>(null)

function useRoute() {
  return useContext(context)
}

function Routes(props: RoutesProps) {
  return [`

  let bottomExportString =
`export {
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

      const commonRouteTsxString = _createCommonRouteTsxString(e, tab, String(rid), mid, lazyImportString);

      if (e.layout) {
        mainString +=
`${parent?.layout ? '\n' : ''}${commonRouteTsxString}
${tab}>`

        return () => {
          mainString +=
`
${tab}</Route>${parent?.layout ? '' : ',\n'}`
				}
      } else {
        mainString +=
`${parent?.layout ? '\n' : ''}${commonRouteTsxString}
${tab}/>${parent?.layout ? '' : ',\n'}`
      }
    })
  }

  mainString +=
`  ]
}`
  resultString = `${topImportString}\n\n${mainString}\n\n${bottomExportString}`
  // console.log(JSON.stringify(fileRoutes, null, 2))

  fs.writeFileSync(path.resolve(__dirname, './result.tsx'), resultString)

  return mainString
}

function run() {
  _transformRoutesTsxString()
}

run()
