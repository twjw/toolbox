import { App as I18nApp, dictionary, Locale, locale, setLocale, t } from '~i18n'

let current = 0
let langs: Locale[] = ['zh_TW', 'en']

function App() {
	return (
		<I18nApp defaultLocale={langs[0]}>
			<AppContent />
		</I18nApp>
	)
}

function AppContent() {
	const a = dictionary

	return (
		<div>
			<h1>wtbx-vite-i18n</h1>
			<h2>t('hello'): {t('hello')}</h2>
			<h2>t('come.from'): {t('come.from')}</h2>
			<button onClick={() => setLocale(langs[++current % langs.length])}>
				Change locale! (current: {locale})
			</button>
		</div>
	)
}

export { App }
