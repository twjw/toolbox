import type { FC, ReactNode } from 'react'

namespace ReactPageRoutes {
	export type CreatePageRoutes = (props: {
		Wrap: FC<{ path: string; children: ReactNode }>
	}) => ReactNode

	export type UsePageRute<Meta = undefined> = () => { path: string } & { meta: Meta }
}

type ReactPageRoutesOptions = {
	defaultMeta?: any // 預設的 meta 資料
	pages: string[] // 頁面目錄的絕對路徑(後蓋前)
}

export type { ReactPageRoutesOptions, ReactPageRoutes }
