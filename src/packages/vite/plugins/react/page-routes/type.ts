import type { FC, ReactNode } from 'react'

namespace ReactPageRoutes {
	export type CreatePageRoutes = (props: {
		Wrap: FC<{ path: string; children: ReactNode }>
	}) => ReactNode

	export type MatchPageRoute<Meta = undefined> = (
		pathname: string,
	) => { path: string; meta: Meta } | null

	export type UsePageRute<Meta = undefined> = (
		location: { pathname: string } | string,
	) => { path: string; meta: Meta } | null
}

type ReactPageRoutesOptions = {
	defaultMeta?: any // 預設的 meta 資料
	pages: string[] // 頁面目錄的絕對路徑(後蓋前)
}

export type { ReactPageRoutesOptions, ReactPageRoutes }
