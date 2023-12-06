import { Route } from 'react-router-dom'
import {lazy, LazyExoticComponent, FC, ReactNode, createContext, useContext} from 'react'
import type { Log } from "../../common";

type Route = {
  path: string
  meta: any
  LazyPage: LazyExoticComponent<any>
  children?: Route[]
}

type Wrap = FC<{ children: ReactNode }>

type EagerModule<T = any> = { default: T }

type MetaModule = Record<string, EagerModule>

type ImportModule = <T = any>() => Promise<T>

type PageModule = Record<string, ImportModule>

type RegisterOptions = {
  log?: Log,
  ignorePrefixes: string[]
  defaultMeta?: any
  metaModules?: MetaModule[]
  pageModules: PageModule[]
  Wrap: Wrap
}

type MergeModulesMap<M extends EagerModule | ImportModule, R = M> = (modulePath: string, module: M) => R

type CommonRouteContext = { path: string }

let _routes: Route[] = []
let _Wrap: Wrap
let pageRoutes: ReactNode = null
const _OUTLET = 'outlet'
const context = createContext<any>(null)
function useRoute<T>() {
  return useContext<T & CommonRouteContext>(context)
}

  /**
 * @return 表示是否有該 outlet
 */
function _passRouteChildren(
  path: string,
  routes: Record<string, Route> = {},
  outlets: Record<string, Route[]> = {},
  route?: Route,
) {
  if ((route != null || routes[path || '/'] != null) && outlets[path] != null) {
    const children = outlets[path]
    const _route = route || routes[path || '/']

    _route.children = children
    delete outlets[path]

    for (let i = 0; i < children.length; i++) {
      _passRouteChildren(path + '/' + children[i].path, routes, outlets, children[i])
    }

    return true
  }

  return false
}

function _recursivePassChildrenRoutePath(
  routePaths: string[] = [],
  path = '',
  route: Route = {} as Route,
) {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++) {
      const e = route.children[i]
      const _path = `${path.length === 1 ? '' : path}/${e.path}`
      routePaths.push(_path)
      _recursivePassChildrenRoutePath(routePaths, _path, e)
    }
  }
}

function _flatRoutePaths(routes: Record<string, Route> = {}) {
  const routePaths = []

  for (const k in routes) {
    const e = routes[k]
    routePaths.push(e.path)
    _recursivePassChildrenRoutePath(routePaths, e.path, e)
  }

  return routePaths
}

function _mergeModules<M extends EagerModule | ImportModule, R = M> (ignorePrefixReg: RegExp, modules: Record<string, M>[], map?: MergeModulesMap<M, R>) {
  const moduleMap: Record<string, any> = {}

  for (let i = 0; i < modules.length; i++) {
    const currentModuleMap = modules[i]
    for (const modulePath in currentModuleMap) {
      const noPrefixPath = modulePath.replace(ignorePrefixReg, '')
      moduleMap[noPrefixPath] = map ? map(noPrefixPath, currentModuleMap[modulePath]) : currentModuleMap[modulePath]
    }
  }

  return moduleMap as Record<string, R>
}

function registerPageRoutes({
                                log,
                                ignorePrefixes,
                                defaultMeta,
                                metaModules,
                                pageModules,
                                Wrap,
                              }: RegisterOptions) {
  const outlets: Record<string, Route[]> = {}
  const routes: Record<string, Route> = {}
  const ignorePrefixStr = `(${ignorePrefixes.join('|')})*`
  const bracketOutlet = `\/\\(${_OUTLET}\\)`
  const isOutletAll = new RegExp(`^${ignorePrefixStr}${bracketOutlet}`).test(Object.keys(pageModules?.[0] || {})[0] || '')
  const ignorePrefixReg = new RegExp(`^${ignorePrefixStr}${isOutletAll ? bracketOutlet : ''}`)
  const metaModuleMap = _mergeModules<EagerModule>(ignorePrefixReg, metaModules || [])
  const pageModuleMap = _mergeModules<ImportModule, { meta: any, module: ImportModule }>(ignorePrefixReg, pageModules, (modulePath, module) => {
    const metaPath = modulePath.replace(/page\.tsx$/, 'page.meta.ts')

    return {
      meta: metaModuleMap[metaPath]?.default,
      module,
    }
  })

  for (const modulePath in pageModuleMap) {
    const noPrefixPath = modulePath.replace(ignorePrefixReg, '')
    const spByOutlets = noPrefixPath.split(`/(${_OUTLET})`)

    // 如果含 (outlet) 且非全局 (outlet) 做特殊處理(子級處理)
    if (spByOutlets.length > 1) {
      let path = ''

      for (let i = 0; i < spByOutlets.length - 1; i++) {
        path += spByOutlets[i]
      }

      if (outlets[path] == null) {
        outlets[path] = []
      }

      outlets[path].push({
        path: spByOutlets[spByOutlets.length - 1].replace(/^\/?(.+)\/page\.tsx$/, '$1'),
        meta: pageModuleMap[modulePath].meta,
        LazyPage: lazy(() => pageModuleMap[modulePath].module()),
      })

      continue
    }

    const paths = noPrefixPath.split('/')
    let _path = ''

    // 拚前綴路徑
    for (let i = 1; i < paths.length - 1; i++) {
      if (paths[i][0] === '[') {
        const paramName = paths[i]
          .substring(1, paths[i].length - 1)
          .split('-')
          .reduce((p, e, i) => p + (i === 0 ? e : `${e[0].toUpperCase()}${e.substring(1)}`), '')
        _path += `/:${paramName}`
      } else {
        _path += `/${paths[i]}`
      }
    }

    const routePath = _path || '/'
    routes[routePath] = {
      path: routePath,
      meta: pageModuleMap[modulePath].meta,
      LazyPage: lazy(() => pageModuleMap[modulePath].module()),
    }
  }

  // 將子路由們塞進他爹娘裡
  let max = 1000,
    exec = 0
  while (exec < max && Object.keys(outlets).length > 0) {
    for (const path in outlets) {
      if (_passRouteChildren(path, routes, outlets)) break
    }
    exec++
  }
  if (exec >= max) {
    ;(log || console).warn('路由生成比對次數超過上限，請排查...')
  }

  if (log && log.isDebug) {
    const flatRoutePaths = _flatRoutePaths(routes)
    log.info(`項目 pages 生成的路由(length: ${flatRoutePaths.length})`)
    log.info(flatRoutePaths)
  }
  console.log(outlets, routes)

  if (isOutletAll) {
    let index = routes['/']
    delete routes['/']
    if (index) {
      const children = [] as Route[]
      for (const path in routes) {
        children.push(routes[path])
        delete routes[path]
      }
      index.children = children
    }
    routes['/'] = index
  }

  _Wrap = Wrap
  _routes = Object.values(routes)
  pageRoutes = mapRoutes(_routes)
}

function mapRoutes(routes: Route[] = [], parentPath = '/') {
  return routes.map(e => {
    const nextPath = parentPath === '/' ? e.path : `${parentPath}/${e.path}`

		return (<Route
			key={e.path}
			path={e.path}
			element={
        <context.Provider key={nextPath} value={{ path: nextPath, meta: e.meta }}>
          <_Wrap>
            <e.LazyPage />
          </_Wrap>
        </context.Provider>
			}
		>
			{e.children ? mapRoutes(e.children, nextPath) : null}
		</Route>)
	})
}

export type { CommonRouteContext }
export { registerPageRoutes, pageRoutes, useRoute }
