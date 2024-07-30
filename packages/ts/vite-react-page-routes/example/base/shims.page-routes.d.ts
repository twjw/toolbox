declare module '~page-routes' {
	import type { PageMeta } from './type.d.ts'
	import { type PageRoutes } from 'wtbx-vite-react-page-routes'

	export const createPageRoutes: PageRoutes.CreatePageRoutes
	export const usePageRoute: PageRoutes.UsePageRoute<PageMeta>
	export const matchPageRoute: PageRoutes.MatchPageRoute<PageMeta>
	export const relativeRoutePathMap: PageRoutes.RelativeRoutePathMap
}
