import { useEffect, useRef } from 'react'

function ChangeTimes() {
	const countRef = useRef(0)
	useEffect(() => {
		countRef.current++
	})
	return <span style={{ marginLeft: 4, fontSize: 13 }}>已渲染: {countRef.current} 次</span>
}

export { ChangeTimes }
