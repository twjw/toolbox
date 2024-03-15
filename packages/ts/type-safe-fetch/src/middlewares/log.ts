import type { TsFetchWatchMap, TsFetchListenerRequestInit } from '../type'

const log: TsFetchWatchMap<Error, TsFetchListenerRequestInit, any, any> = {
	response(req, res) {
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
	},
	error(error, req, res) {
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
	},
}

export { log }
