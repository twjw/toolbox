export declare module '~i18n' {
	import type { ReactNode } from 'react'

	type RecursiveKeyOf<Obj extends object, Sep extends string = '.'> = {
		[K in keyof Obj & (string | number)]: Obj[K] extends object
			? `${K}` | `${K}${Sep}${RecursiveKeyOf<Obj[K]>}`
			: `${K}`
	}[keyof Obj & (string | number)]

	type Translate<Dictionary extends Record<string, any>> = (
		key: RecursiveKeyOf<Dictionary>,
		idxValList?: (string | number)[],
		keyValMap?: Record<string, string | number>,
	) => string

	type SetLocale<Locale> = (locale: Locale, auto?: boolean) => Promise<void | (() => void)>

	type AppComponent<Locale> = (props: {
		defaultLocale?: Locale
		fallback?: ReactNode
		children: ReactNode
	}) => ReactNode

	export type Dictionary = __INJECT__
	export type Locale = __INJECT__
	export type KeyofDictionary = RecursiveKeyOf<Dictionary>
	export const dictionary: Dictionary
	export const locale: Locale
	export const t: Translate<Dictionary>
	export const setLocale: SetLocale<Locale>
	export const App: AppComponent<Locale>
}
