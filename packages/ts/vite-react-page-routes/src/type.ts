import type { FC, ReactNode } from 'react'

namespace PageRoutes {
	export type CreatePageRoutes = (props: {
		guard?: FC<{ path: string; children: ReactNode }>
	}) => ReactNode

	export type MatchPageRoute<Meta = undefined> = (
		pathname: string,
		trans?: (paramName: string) => string,
	) => { path: string; meta?: Meta } | null

	export type UsePageRoute<Meta = undefined> = (
		location?: { pathname: string } | string,
	) => { path: string; meta?: Meta } | null

	// _p 參數名, _m meta
	export type RelativeRoutePathMap = Record<string, any>
}

type PageRoutesOptions = {
	defaultMeta?: any // 預設的 meta 資料
	pages: string[] // 頁面目錄的絕對路徑(後蓋前)
}

export type { PageRoutesOptions, PageRoutes }
