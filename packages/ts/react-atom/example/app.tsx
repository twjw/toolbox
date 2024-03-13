import { BaseSample } from './components/base-sample'

function App() {
	return (
		<div
			style={{
				width: '100vw',
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: 32,
				flexDirection: 'column',
			}}
		>
			<BaseSample />
		</div>
	)
}

export { App }
