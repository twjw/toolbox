import { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createPageRoutes } from '~page-routes'

export function App() {
	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<BrowserRouter>
				<Routes>
					<Route path={'/'} element={<Navigate to={'/home'} replace />} />
					{createPageRoutes({ guard: RouteGuard })}
				</Routes>
			</BrowserRouter>
		</div>
	)
}

function RouteGuard({ path, children }: { path: string; children: ReactNode }) {
	return children
}
