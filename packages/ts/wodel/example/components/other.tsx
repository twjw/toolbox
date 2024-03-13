import { useState } from 'react'
import { wodel } from 'wodel'
import { ChangeTimes } from './change-times.tsx'

const count = wodel<number>(0)

function Count() {
	const _count = count.use

	return <div>{_count}</div>
}

function CalcBtn() {
	return (
		<button
			onClick={() => {
				console.log(count.value)
				count(c => c + 1)
			}}
		>
			數字+1
		</button>
	)
}

function TestOther() {
	const [countVisible, setCountVisible] = useState(true)

	return (
		<div>
			<h5 style={{ margin: '0 0 8px' }}>
				wmodel 為值的測試範例
				<ChangeTimes />
			</h5>

			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<button onClick={() => setCountVisible(e => !e)}>
					{countVisible ? '隱藏' : '顯示'}
				</button>
				<span style={{ display: 'inline-block', width: 8 }} />
				{countVisible ? (
					<div style={{ display: 'flex' }}>
						<Count />
						,&nbsp;
						<Count />
						,&nbsp;
						<Count />
					</div>
				) : (
					<div>-</div>
				)}
				<span style={{ display: 'inline-block', width: 8 }} />
				<CalcBtn />
				<span style={{ display: 'inline-block', width: 8 }} />
				<button onClick={() => count(0)}>重製</button>
			</div>
		</div>
	)
}

export { TestOther }
