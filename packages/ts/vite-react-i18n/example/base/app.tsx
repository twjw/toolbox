import { App as I18nApp, Locale, locale, setLocale, t } from '~i18n'

let current = 0
let langs: Locale[] = ['zh_CN', 'en_US']

function App() {
	return (
		// 預設語系
		<I18nApp defaultLocale={langs[0]}>
			<AppContent />
		</I18nApp>
	)
}

function AppContent() {
	function onChangeLocale() {
		setLocale(langs[++current % langs.length])
	}

	return (
		<div>
			<h1>wtbx-vite-i18n</h1>
			{/*這麼做就可以取得翻譯了*/}
			<h2>t('hello'): {t('a.hello')}</h2>
			<h2>t('come.from'): {t('next.c.lemon')}</h2>
			<h2>t('skills'): {t('skills', ['java', 'script'], { name: 'typescript' })}</h2>
			{/* 使用 setLocale 傳入 locale 就可以更新應用的語系 */}
			<button onClick={onChangeLocale}>
				{/*locale 為當前語系*/}
				Change locale! (current: {locale})
			</button>
		</div>
	)
}

export { App }
