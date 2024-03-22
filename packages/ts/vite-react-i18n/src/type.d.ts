import type { ReactNode } from 'react'

namespace I18n {
	type RecursiveKeyOf<Obj extends object, Sep extends string = '.'> = {
		[K in keyof Obj & (string | number)]: Obj[K] extends object
			? `${K}` | `${K}${Sep}${RecursiveKeyOf<Obj[K]>}`
			: `${K}`
	}[keyof Obj & (string | number)]

	export type Translate<Dictionary extends Record<string, any>> = (
		key: RecursiveKeyOf<Dictionary>,
		idxValList?: (string | number)[],
		keyValMap?: Record<string, string | number>,
	) => string

	export type SetLocale<Locale> = (
		locale: Locale,
		auto?: boolean,
	) => Promise<void | (() => void)>

	export type App<Locale> = (props: {
		defaultLocale?: Locale
		fallback?: ReactNode
		children: ReactNode
	}) => ReactNode
}

export type { I18n }
