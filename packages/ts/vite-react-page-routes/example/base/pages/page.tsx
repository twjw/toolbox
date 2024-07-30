import { Link, Outlet } from 'react-router-dom'

function Page() {
	return (
		<div style={{ width: '100%' }}>
			<div style={{ padding: '0 16px' }}>
				<Link to={'/home'}>
					<button>/home</button>
				</Link>
			</div>

			<hr />

			<div style={{ textAlign: 'center' }}>
				<Outlet />
			</div>
		</div>
	)
}

export default Page
