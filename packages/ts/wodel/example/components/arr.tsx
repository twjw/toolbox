import { ChangeTimes } from './change-times.tsx'
import { wodel } from 'wodel'
import { useState } from 'react'

const counts = wodel([0, 1, 2])

function Count(props: { idx: number }) {
	const _count = counts.use

	return <div>{_count[props.idx]}</div>
}

function CalcBtn() {
	return (
		<button
			onClick={() => {
				console.log(counts.value, counts[0])
				// counts(c => c + 1)
			}}
		>
			數字+1
		</button>
	)
}

function TestArr() {
	const [countVisible, setCountVisible] = useState(true)

	return (
		<div>
			<h5 style={{ margin: '0 0 8px' }}>
				wmodel 為數組的測試範例
				<ChangeTimes />
			</h5>

			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<button onClick={() => setCountVisible(e => !e)}>
					{countVisible ? '隱藏' : '顯示'}
				</button>
				<span style={{ display: 'inline-block', width: 8 }} />
				{countVisible ? (
					<div style={{ display: 'flex' }}>
						<Count idx={0} />
						,&nbsp;
						<Count idx={1} />
						,&nbsp;
						<Count idx={2} />
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

export { TestArr }
