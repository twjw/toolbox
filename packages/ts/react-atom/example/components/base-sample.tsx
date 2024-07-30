import { ChangeTimes } from './change-times.tsx'
import { watom } from 'wtbx-react-atom'
import { useState } from 'react'

const $count = watom<number>(0)
const $doubleCount = watom(get => get($count) * 2)

const stop = $count.watch((before, after) => {
	console.log(`[$count watch] before: ${before}, after: ${after}`)
	if (after === 0) {
		alert('$count 已經歸 0，清除監聽器(watch)')
		stop()
	}
})

// $count(e => e + 1)

function Count() {
	const count = $count.use()

	return (
		<span>
			{count}
			<ChangeTimes />
		</span>
	)
}

function DoubleCount() {
	const doubleCount = $doubleCount.use()

	return (
		<span>
			(x2 = {doubleCount}
			<ChangeTimes />)
		</span>
	)
}

function IncBtn() {
	return <button onClick={() => $count(e => e + 1)}>+1</button>
}

function SubBtn() {
	return <button onClick={() => $count($count.value - 1)}>-1</button>
}

function ResetBtn() {
	return <button onClick={() => $count(0)}>歸 0</button>
}

function BaseSample() {
	const [isShowCount, setIsShowCount] = useState(true)
	const [isShowDoubleCount, setIsShowDoubleCount] = useState(true)

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<h5 style={{ margin: '0 0 8px', textAlign: 'center' }}>
				<div>基本計數器範例</div>
				<div>(components/base-sample.tsx)</div>
			</h5>

			{isShowCount && <Count />}
			{isShowDoubleCount && <DoubleCount />}

			<hr />
			<div style={{ display: 'flex' }}>
				<button onClick={() => setIsShowCount(e => !e)}>
					{isShowCount ? '隱藏' : '顯示'} count
				</button>
				<button onClick={() => setIsShowDoubleCount(e => !e)}>
					{isShowDoubleCount ? '隱藏' : '顯示'} doubleCount
				</button>
			</div>
			<hr />

			<div style={{ display: 'flex' }}>
				<ChangeTimes />
				<div style={{ width: 8 }} />
				<SubBtn />
				<div style={{ width: 8 }} />
				<ResetBtn />
				<div style={{ width: 8 }} />
				<IncBtn />
			</div>
		</div>
	)
}

export { BaseSample }
