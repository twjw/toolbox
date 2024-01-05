import path from 'path'
import { META_NAME, OUTLET_NAME, PAGE_NAME } from '../../../constants'
import { SL } from '../../../../../../../../general/constants'
import { recursiveFindDataRoute } from '../../../data-routes/recursive-find'
import { DataRoute } from '../../../data-routes/type'
import { type ReactPageRoutesOptions } from '../../../type'

enum RelativeTypeEnum {
	meta,
	page,
}

function _toRelativeModulePath(dr: DataRoute, pages: string[], type: RelativeTypeEnum) {
	return `./${path
		.relative(
			process.cwd(),
			`${
				pages[dr.relateFileIdxes[type === RelativeTypeEnum.meta ? 'meta' : 'page'] as number]
			}${dr.parentFilenames.join('')}${dr.filename === SL ? '' : dr.filename}${SL}${
				type === RelativeTypeEnum.meta
					? META_NAME
					: type === RelativeTypeEnum.page
					  ? PAGE_NAME
					  : ''
			}`,
		)
		.replace(/\\/g, '/')}`
}

function _transFilename(filename: string) {
	if (filename[0] === '[') {
		return `:${filename
			.substring(SL.length, filename.length - 1)
			.split('-')
			.map((e, i) => (i > 0 ? `${e[0].toUpperCase()}${e.substring(1)}` : e))
			.join('')}`
	}

	return filename
}

function _toFullRoutePath(dr: DataRoute) {
	let result = ''
	for (let i = 0; i < dr.parentFilenames.length; i++) {
		if (dr.parentFilenames[i] === SL || dr.parentFilenames[i] === `${SL}${OUTLET_NAME}`)
			continue
		result += `/${_transFilename(dr.parentFilenames[i].substring(SL.length))}`
	}
	return `${result}/${_transFilename(dr.filename.substring(SL.length))}`
}

function _toRoutePath(dr: DataRoute) {
	let result = ''

	if (dr.parentFilenameIdx != null) {
		if (dr.parentFilenameIdx + 1 < dr.parentFilenames.length) {
			let first = true
			for (let i = dr.parentFilenameIdx + 1; i < dr.parentFilenames.length; i++) {
				if (dr.parentFilenames[i] === SL || dr.parentFilenames[i] === `${SL}${OUTLET_NAME}`)
					continue
				result += `${first ? (first = false) || '' : '/'}${_transFilename(
					dr.parentFilenames[i].substring(SL.length),
				)}`
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

function _passFullRoutePathMap(
	pathMap: Record<string, any>,
	dataRoute: DataRoute,
	mid: number | undefined,
) {
	const paths = dataRoute.parentFilenames.reduce<string[]>((p, e) => {
		let path = e.substring(1) || '/'
		if (path === OUTLET_NAME) return p
		if (path[0] === '[') {
			const pathParam = path.substring(1, path.length - 1)
			path = ':'
			for (let i = 0; i < pathParam.length; i++) {
				if (pathParam[i] === '-') {
					path += pathParam[++i].toUpperCase()
					continue
				}
				path += pathParam[i]
			}
		}
		p.push(path)
		return p
	}, [])
	/*
		eg. '/': {
			'_m': number | null
			':': { // 表示帶參
				'_p': string // :後的字串
				'_m': number | null
				...
			}
			[path]: { // 表示靜態
				'_m': number | null
				...
			}
			...
		}
	 */
	let node: Record<string, any> = pathMap
	for (let j = 0; j < paths.length; j++) {
		const isDynamic = paths[j][0] === ':'
		const routePath = isDynamic ? ':' : paths[j][0]

		if (node[routePath] == null) {
			node = node[routePath] = {
				_m: mid,
			}
			if (isDynamic) {
				node._p = paths[j].substring(1)
			}
		} else {
			node = node[routePath]
		}
	}
}

function convertToReactRouterDomV6_3(
	dataRoutes: DataRoute[],
	options: ReactPageRoutesOptions,
): string {
	const lines: (string | string[])[] = [
		// idx: 0 import
		[
			"import { lazy, createContext, useContext } from 'react'",
			"import { Route, useLocation } from 'react-router-dom'",
		],
		// idx: 1 lazy
		[],
		// idx: 2 fullRoutePathMap
		'const fullRoutePathMap = ',
		[
			'const context = createContext(null)',
			`const defaultMeta = ${
				options.defaultMeta == null ? undefined : JSON.stringify(options.defaultMeta, null, 2)
			}`,
			`function matchPageRoute(path) {
				if (typeof path !== 'string') return null
				
				const sp = path.split('/')
				
				if (sp.length === 1) return null
				
				if (sp.length === 2 && sp[1] === '') {
					return { path: '/', meta: fullRoutePathMap['/']?._m }
				}
				
				let fullRoutePath = ''
				let node = fullRoutePathMap
				for (let i = 1; i < sp.length; i++) {
					const isLast = i === sp.length - 1
					
					if (node[':'] != null) {
						if (isLast) return { path: fullRoutePath + '/:' + node._p, meta: node._m }
						fullRoutePath += '/:' + node._p
						node = node[':']
						continue
					}
					
					if (node[sp[i]] == null) return null
					else if (isLast) {
						return { path: fullRoutePath + '/' + sp[i], meta: node._m }
					} else {
						fullRoutePath += '/' + sp[i]
						node = node[sp[i]]
					}
				}
				
				return null
			}
			
			function usePageRoute(location) {
				if (location == null) return useContext(context)
				else return matchPageRoute(location?.pathname || location)
      }`,
		],
		// idx: 4 createPageRoutes
		`function createPageRoutes(props) `,
		`export { matchPageRoute, usePageRoute, createPageRoutes }`,
	]
	const fullRoutePathMap: Record<string, any> = {}
	const strRoutes: string[] = []
	const idx = {
		import: 0,
		lazy: 1,
		fullRoutePathMap: 2,
		createPageRoutes: 4,
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

		const fullRoutePath = _toFullRoutePath(dr)
		let mid = dr.relateFileIdxes.meta != null ? `m${++ids.m}` : null

		_passFullRoutePathMap(fullRoutePathMap, dr, mid ? ids.m : undefined)
		if (mid) {
			;(lines[idx.import] as string[]).push(
				`import ${mid} from '${_toRelativeModulePath(
					dr,
					options.pages,
					RelativeTypeEnum.meta,
				)}'`,
			)
		}

		if (dr.relateFileIdxes.page != null) {
			const lazyId = `L${++ids.l}`

			;(lines[idx.lazy] as string[]).push(
				`const ${lazyId} = lazy(() => import('${_toRelativeModulePath(
					dr,
					options.pages,
					RelativeTypeEnum.page,
				)}'))`,
			)

			const route = `<Route key={${++ids.r}} path="${_toRoutePath(
				dr,
			)}" element={<context.Provider value={{ path: '${fullRoutePath}', meta: ${
				mid || 'defaultMeta'
			} }}><props.Wrap><${lazyId} /></props.Wrap></context.Provider>}`

			if (isParentRoute) {
				strRoutes.push(`${route}>`)
			} else {
				strRoutes.push(`${route} />`)
			}
		}
	})

	lines[idx.fullRoutePathMap] += JSON.stringify(fullRoutePathMap).replace(
		/_m":([0-9]+)/g,
		'_m":m$1',
	)
	lines[idx.createPageRoutes] += `{\nreturn ${
		strRoutes.length > 0
			? `(\n${strRoutes.length > 1 ? '<>\n' : ''}${strRoutes.join('\n')}${
					strRoutes.length > 1 ? '\n</>' : ''
			  }\n)`
			: 'null'
	}\n}`

	return lines.map(e => (typeof e === 'string' ? e : e.join('\n'))).join('\n')
}

export { convertToReactRouterDomV6_3 }
