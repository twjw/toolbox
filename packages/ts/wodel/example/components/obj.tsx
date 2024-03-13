import { ChangeTimes } from './change-times.tsx'

function TestObj() {
	return (
		<div>
			<h5 style={{ margin: '0 0 8px' }}>
				wmodel 為物件的測試範例
				<ChangeTimes />
			</h5>

			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
		</div>
	)
}

export { TestObj }
