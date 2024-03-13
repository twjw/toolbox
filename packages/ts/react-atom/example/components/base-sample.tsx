import { ChangeTimes } from './change-times.tsx'
import { watom } from 'wtbx-react-atom'

const $count = watom(0 as number)

const stop = $count.watch((before, after) => {
	console.log(`$count before: ${before}, after: ${after}`)
	if (after === 0) {
		alert('$count 已經歸 0，清除監聽器')
		stop()
	}
})

function Count() {
	const count = $count.use
	return (
		<span>
			{count}
			<ChangeTimes />
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
	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<h5 style={{ margin: '0 0 8px', textAlign: 'center' }}>
				<div>基本計數器範例</div>
				<div>(components/base-sample.tsx)</div>
			</h5>
			<Count />
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
