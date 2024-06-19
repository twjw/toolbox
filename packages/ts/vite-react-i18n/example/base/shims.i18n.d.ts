declare module '~i18n' {
	import type { I18n } from 'wtbx-vite-react-i18n'
	import type { RecursiveKeyOf } from 'wtbx-types'
	export type Locale = 'zh_TW' | 'en'
	export type Dictionary = typeof import('./assets/locales/zh_TW.ts').default
	export type KeyofDictionary = RecursiveKeyOf<Dictionary>
	export const dictionary: Dictionary
	export const locale: Locale
	export const t: I18n.Translate<Dictionary>
	export const setLocale: I18n.SetLocale<Locale>
	export const App: I18n.App<Locale>
}
