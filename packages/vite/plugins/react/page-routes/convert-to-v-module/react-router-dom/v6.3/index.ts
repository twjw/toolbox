import path from 'path'
import { META_NAME, OUTLET_NAME, PAGE_NAME } from '../../../constants.ts'
import { SL } from '../../../../../../../../constants'
import { recursiveFindDataRoute } from '../../../data-routes/recursive-find.ts'
import { DataRoute } from '../../../data-routes/type.ts'
import {type ReactPageRoutesOptions} from "../../../type.ts";

enum RelativeTypeEnum {
	meta,
	page,
}

function _toRelativeModulePath (dr: DataRoute, pages: string[], type: RelativeTypeEnum) {
  return `./${path.relative(process.cwd(), `${pages[dr.relateFileIdxes[type === RelativeTypeEnum.meta ? 'meta' : 'page'] as number]}${dr.parentFilenames.join('')}${dr.filename === SL ? '' : dr.filename}${SL}${type === RelativeTypeEnum.meta ? META_NAME : type === RelativeTypeEnum.page ? PAGE_NAME : ''}`).replace(/\\/g, '/')}`
}

function _transFilename (filename: string) {
  if (filename[0] === '[') {
    return `:${filename.substring(SL.length, filename.length - 1).split('-').map(((e, i) => i > 0 ? `${e[0].toUpperCase()}${e.substring(1)}` : e)).join('')}`
  }

  return filename
}

function _toFullRoutePath (dr: DataRoute) {
  let result = ''
  for (let i = 0; i < dr.parentFilenames.length; i++) {
    if (dr.parentFilenames[i] === SL || dr.parentFilenames[i] === `${SL}${OUTLET_NAME}`) continue
    result += `/${_transFilename(dr.parentFilenames[i].substring(SL.length))}`
  }
  return `${result}/${_transFilename(dr.filename.substring(SL.length))}`
}

function _toRoutePath (dr: DataRoute) {
  let result = ''

  if (dr.parentFilenameIdx != null) {
    if (dr.parentFilenameIdx + 1 < dr.parentFilenames.length) {
      let first = true
      for (let i = dr.parentFilenameIdx + 1; i < dr.parentFilenames.length; i++) {
        if (dr.parentFilenames[i] === SL || dr.parentFilenames[i] === `${SL}${OUTLET_NAME}`)
          continue
        result += `${first ? ((first = false) || '') : '/'}${_transFilename(dr.parentFilenames[i].substring(SL.length))}`
      }
    }

    if (result.length === 0) {
      return _transFilename(dr.filename.substring(SL.length))
    }

    return `${result}/${_transFilename(dr.filename.substring(SL.length))}`
  } else {
    for (let i = 0; i < dr.parentFilenames.length; i++) {
      if (dr.parentFilenames[i] === SL || dr.parentFilenames[i] === `${SL}${OUTLET_NAME}`)
				continue
      result += `/${_transFilename(dr.parentFilenames[i].substring(SL.length))}`
    }

    return `${result}/${_transFilename(dr.filename.substring(SL.length))}`
  }
}

function convertToReactRouterDomV6_3 (dataRoutes: DataRoute[], options: ReactPageRoutesOptions): string {
  const lines: (string|string[])[] = [
    // idx: 0 import
    [
      'import { lazy, createContext, useContext } from \'react\'',
      'import { Route } from \'react-router-dom\'',
    ],
    // idx: 1 lazy
    [],
    [
      'const context = createContext(null)',
      `const defaultMeta = ${options.defaultMeta == null ? undefined : JSON.stringify(options.defaultMeta, null, 2)}`,
      `function usePageRoute(fullRoutePath) {
        const ctx = useContext(context)
        if (fullRoutePath == null) return ctx
        return { path: fullRoutePath, meta: fullRouteMetaMap[fullRoutePath] || defaultMeta }
      }`
    ],
    // idx: 3 createPageRoutes
    `function createPageRoutes(props) `,
    `export { usePageRoute, createPageRoutes }`
  ]
  const strRoutes: string[] = []
  const idx = {
    import: 0,
    lazy: 1,
    createPageRoutes: 3,
  }
  let ids = {
    r: 0, // route key
    m: 0, // meta
    l: 0, // lazy component
  }

  recursiveFindDataRoute(dataRoutes, (dr, _, location) => {
    const isParentRoute = dr.children.length > 0

    if (location === 'end') {
      if (dr.relateFileIdxes.page != null && isParentRoute) {
				strRoutes.push('</Route>')
			}

      return
    }

    type aaa = {
      id: number | undefined
      child: aaa
    }

    const fullRoutePath = _toFullRoutePath(dr)
    let mid = dr.relateFileIdxes.meta != null ? `m${++ids.m}` : null

    if (mid) {
      (lines[idx.import] as string[]).push(`import ${mid} from '${_toRelativeModulePath(dr, options.pages, RelativeTypeEnum.meta)}'`)
    }

    if (dr.relateFileIdxes.page != null ) {
      const lazyId = `L${++ids.l}`

      ;(lines[idx.lazy] as string[]).push(
        `const ${lazyId} = lazy(() => import('${_toRelativeModulePath(
          dr,
          options.pages,
          RelativeTypeEnum.page,
        )}'))`,
      )

      const route = `<Route key="${++ids.r}" path="${_toRoutePath(dr)}" element={<context.Provider value={{ path: '${fullRoutePath}', meta: ${mid || 'defaultMeta'} }}><props.Wrap><${lazyId} /></props.Wrap></context.Provider>}`

      if (isParentRoute) {
        strRoutes.push(`${route}>`)
      } else {
				strRoutes.push(`${route} />`)
			}
    }
  })

  lines[idx.createPageRoutes] += `{\nreturn ${strRoutes.length > 0 ? `(\n${strRoutes.length > 1 ? '<>\n' : ''}${strRoutes.join('\n')}${strRoutes.length > 1 ? '\n</>' : ''}\n)` : 'null'}\n}`

  return lines.map(e => typeof e === 'string' ? e : e.join('\n')).join('\n')
}


export {
  convertToReactRouterDomV6_3
}
