import { TsFetchListenerRequestInit } from '../../type'

function error(error: Error, req: TsFetchListenerRequestInit, res: Response) {
	console.warn(
		`%c${req.method?.toUpperCase() || 'get'} %c${req.url}`,
		'border: 1px solid red; background-color: red; color: #fff; padding: 0 2px 0 4px;',
		'border: 1px solid red; padding: 0 2px 0 4px;',
		'\n',
		req,
		'\n',
		error,
	)

	return res
}

export { error }
