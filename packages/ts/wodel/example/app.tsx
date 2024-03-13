import { TestOther } from './components/other.tsx'
import { TestArr } from './components/arr.tsx'
import { TestObj } from './components/obj.tsx'

function App() {
	return (
		<div
			style={{
				width: '100vw',
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: 32,
				flexDirection: 'column',
			}}
		>
			<TestOther />
			<div
				style={{
					margin: '32px 0',
					width: '100%',
					height: 2,
					backgroundColor: 'rgba(0,0,0,0.2)',
				}}
			/>
			<TestArr />
			<div
				style={{
					margin: '32px 0',
					width: '100%',
					height: 2,
					backgroundColor: 'rgba(0,0,0,0.2)',
				}}
			/>
			<TestObj />
		</div>
	)
}

export { App }
