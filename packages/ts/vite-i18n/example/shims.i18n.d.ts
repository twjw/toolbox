declare module '~i18n' {
	export type Locale = 'zh_TW' | 'en'
	export type Dictionary = typeof import('./assets/locales/zh_TW.ts').default
}
