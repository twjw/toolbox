import type { ReactNode } from 'react'
import type { WObject } from '../../../../type'

namespace WtbxI18n {
	export type Translate<Dictionary extends Record<string, any>> = (
		key: WObject.RecursiveKeyOf<Dictionary>,
		value?: string[],
	) => string

	export type SetLocale<Locale> = (locale: Locale) => Promise<void>

	export type App<Locale> = (props: {
		defaultLocale?: Locale
		fallback?: ReactNode
		children: ReactNode
	}) => ReactNode
}

export type { WtbxI18n }
