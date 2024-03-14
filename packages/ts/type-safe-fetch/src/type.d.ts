export type TsFetchRequestListener<
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
> = (req: Req) => Req | Promise<Req>

export type TsFetchResponseListener<
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Res = Response,
	Return = Res | Promise<Res>,
> = (req: Readonly<Req>, res: Res) => Return

export type TsFetchErrorListener<
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Err extends Error = Error,
	Return = Response | Promise<Response>,
> = (req: Readonly<Req>, error: Err) => Return

export type LuCaseString<S extends string> = S | Uppercase<S>

export type TsFetchMethod = LuCaseString<'get' | 'put' | 'post' | 'delete' | 'options'>

export type TsFetchListenerRequestInit = TsFetchRequestInit & { url: string }

export type TsFetchRequestInit = Omit<RequestInit, 'method'> & {
	method?: TsFetchMethod
}

export type TsFetchWatch = {
	request: <Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit>(
		listener: TsFetchRequestListener<Req>,
	) => void
	response: <
		Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
		Res = Response,
		Return = Res | Promise<Res>,
	>(
		listener: TsFetchResponseListener<Req, Res, Return>,
	) => void
	error: <
		Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
		Err extends Error = Error,
		Return = Response | Promise<Response>,
	>(
		listener: TsFetchErrorListener<Req, Err, Return>,
	) => void
}

export type TsFetchWatchMap<
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Res = Response,
	Return = Res,
	Err extends Error = Error,
> = Partial<{
	request: TsFetchRequestListener<Req>
	response: TsFetchResponseListener<Req, Res, Return>
	error: TsFetchErrorListener<Req, Err, Return>
}>

export type TsFetchMiddleware = <
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Res = Response,
	Return = Res,
	Err extends Error = Error,
>(
	watchMap: TsFetchWatchMap<Req, Res, Return, Err>,
) => void

export type TsFetchApis = {
	watch: TsFetchWatch
	middleware: TsFetchMiddleware
}

export type TsFetchCall = {
	<R = Response>(url: string, init?: TsFetchRequestInit): Promise<R>
}

export type TsFetch = TsFetchCall & TsFetchApis

export type TsFetchBase = TsFetch & { new: TsFetchNew }

export type TsFetchNew = {
	(): TsFetch
}

export type TsFetchTemplateDefinition = {
	headers?: Record<string, any>
	params?: Record<string, any>
	body?: Record<string, any>
	response: any
}

export type TsFetchTemplateIncludeRequestInit<
	Api extends TsFetchTemplateDefinition,
	KS extends (keyof TsFetchTemplateDefinition)[] = ['headers', 'params', 'body'],
> = KS extends [infer K1, ...infer K2]
	? Api[K1] extends Record<string, any>
		? true
		: TsFetchTemplateIncludeRequestInit<Api, K2>
	: false

export type TsFetchTemplateDefineApis<Apis extends Record<string, TsFetchTemplateDefinition>> =
	Apis

export type TsFetchTemplateRequestInit<
	Api extends TsFetchTemplateDefinition,
	Other extends Record<string, any> = {},
> = Omit<TsFetchRequestInit, 'body'> & Omit<Api, 'response'> & Other

export type TsFetchTemplate<
	Apis extends Record<string, TsFetchTemplateDefinition>,
	Other extends Record<string, any> = {},
> = TsFetchApis & {
	<Path extends keyof Apis>(
		url: Path,
		...args: TsFetchTemplateIncludeRequestInit<Apis[Path]> extends true
			? [TsFetchTemplateRequestInit<Apis[Path], Other>]
			: []
	): Promise<Apis[Path]['response']>
}
