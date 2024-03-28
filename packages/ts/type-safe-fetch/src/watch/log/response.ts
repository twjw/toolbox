import { TsFetchListenerRequestInit } from '../../type'

function response(req: TsFetchListenerRequestInit, res: Response) {
	console.log(
		`%c${req.method?.toUpperCase() || 'get'} %c${req.url}`,
		'border: 1px solid green; background-color: green; color: #fff; padding: 0 2px 0 4px;',
		'border: 1px solid green; padding: 0 2px 0 4px;',
		'\n',
		req,
		'\n',
		res,
	)

	return res
}

export { response }
