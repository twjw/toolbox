export type TsFetchRequestListener<
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
> = (req: Req) => Req | Promise<Req>

export type TsFetchResponseListener<
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Res = Response,
	Return = Res | Promise<Res>,
> = (req: Readonly<Req>, res: Res) => Return

export type TsFetchErrorListener<
	Err extends Error = Error,
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Return = Response | undefined | Promise<Response | undefined>,
> = (error: Err, req: Readonly<Req>, res: Return) => Return

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
		Err extends Error = Error,
		Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
		Return = Response | Promise<Response>,
	>(
		listener: TsFetchErrorListener<Err, Req, Return>,
	) => void
}

export type TsFetchWatchMap<
	Err extends Error = Error,
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Res = Response,
	Return = Res,
> = Partial<{
	request: TsFetchRequestListener<Req>
	response: TsFetchResponseListener<Req, Res, Return>
	error: TsFetchErrorListener<Err, Req, Return>
}>

export type TsFetchMiddleware = <
	Err extends Error = Error,
	Req extends TsFetchListenerRequestInit = TsFetchListenerRequestInit,
	Res = Response,
	Return = Res,
>(
	watchMap: TsFetchWatchMap<Err, Req, Res, Return>,
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
	? K1 extends keyof TsFetchTemplateDefinition
		? Api[K1] extends Record<string, any>
			? true
			: K2 extends (keyof TsFetchTemplateDefinition)[]
				? TsFetchTemplateIncludeRequestInit<Api, K2>
				: false
		: false
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
