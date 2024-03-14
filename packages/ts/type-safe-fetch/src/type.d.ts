export type TsFetchRequestListener<Req extends TsFetchOptions = TsFetchOptions> = (
	req: Req,
) => Req | Promise<Req>

export type TsFetchResponseListener<Res = Response, Return = Res | Promise<Res>> = (
	res: Res,
) => Return

export type TsFetchErrorListener<
	Err extends Error = Error,
	Opt extends TsFetchOptions = TsFetchOptions,
	Return = Response | Promise<Response>,
> = (error: Err, options: Readonly<Opt>) => Return

export type LuCaseString<S extends string> = S | Uppercase<S>

export type TsFetchMethod = LuCaseString<'get' | 'put' | 'post' | 'delete' | 'options'>

export type TsFetchOptions = Omit<RequestInit, 'method'> & {
	url: string
	method?: TsFetchMethod
}

export type TsFetchWatch = {
	request: <Req extends TsFetchOptions = TsFetchOptions>(
		listener: TsFetchRequestListener<Req>,
	) => void
	response: <Res = Response, Return = Res | Promise<Res>>(
		listener: TsFetchResponseListener<Res, Return>,
	) => void
	error: <
		Err extends Error = Error,
		Opt extends TsFetchOptions = TsFetchOptions,
		Return = Response | Promise<Response>,
	>(
		listener: TsFetchErrorListener<Err, Opt, Return>,
	) => void
}

export type TsFetchWatchMap<
	Req extends TsFetchOptions = TsFetchOptions,
	Res = Response,
	Return = Res,
	Err extends Error = Error,
> = Partial<{
	request: TsFetchRequestListener<Req>
	response: TsFetchResponseListener<Res, Return>
	error: TsFetchErrorListener<Err, Req, Return>
}>

export type TsFetchMiddleware = <
	Req extends TsFetchOptions = TsFetchOptions,
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
	<R = Response>(options: TsFetchOptions): Promise<R>
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

export type TsFetchTemplateOptions<
	Apis extends Record<string, TsFetchTemplateDefinition>,
	Path extends keyof Apis,
> = { url: Path } & Omit<Apis[Path], 'response'>

export type TsFetchTemplate<
	Apis extends Record<string, TsFetchTemplateDefinition>,
	Other extends Record<string, any> = {},
> = TsFetchApis & {
	<Path extends keyof Apis>(
		options: Omit<TsFetchOptions, 'url' | 'body'> & TsFetchTemplateOptions<Apis, Path> & Other,
	): Promise<Apis[Path]['response']>
}
