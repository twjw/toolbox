import { TsFetchListenerRequestInit, TsFetchMethod } from '../../type'

export function TsFetchToolLog<
	Err extends Error = Error,
	Req extends { method?: TsFetchMethod; url: string } = TsFetchListenerRequestInit,
	Res = Response,
>() {
	return {
		response(req: Readonly<Req>, res: Res) {
			console.log(
				`%c${req.method?.toUpperCase() || 'GET'} %c${req.url}`,
				'border: 1px solid green; background-color: green; color: #fff; padding: 0 2px 0 4px;',
				'border: 1px solid green; padding: 0 2px 0 4px;',
				'\n',
				req,
				'\n',
				res,
			)
		},
		error(error: Err, req: Readonly<Req>, res: Res) {
			console.warn(
				`%c${req.method?.toUpperCase() || 'get'} %c${req.url}`,
				'border: 1px solid red; background-color: red; color: #fff; padding: 0 2px 0 4px;',
				'border: 1px solid red; padding: 0 2px 0 4px;',
				'\n',
				req,
				'\n',
				error,
			)
		},
	}
}
