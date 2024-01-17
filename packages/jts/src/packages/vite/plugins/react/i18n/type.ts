import type { ReactNode } from 'react'
import type { WObject } from '../../../../type'

namespace ReactI18n {
	export type Translate<Dictionary extends Record<string, any>> = (
		key: WObject.RecursiveKeyOf<Dictionary>,
		idxValList?: (string | number)[],
		keyValMap?: Record<string, string | number>,
	) => string

	export type SetLocale<Locale> = (locale: Locale) => Promise<void>

	export type App<Locale> = (props: {
		defaultLocale?: Locale
		fallback?: ReactNode
		children: ReactNode
	}) => ReactNode
}

export type { ReactI18n }
