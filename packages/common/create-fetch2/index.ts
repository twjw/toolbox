import queryString from 'query-string'
import { Fetch2 } from './type'
import { Fetch2AbortError, Fetch2TimeoutError, Fetch2UnknownError } from './error'

const _maxMethodTextLength = 'delete'.length - 1
const _minMethodTextLength = 'get'.length - 1

function _toRequest(prefix: string, config: Fetch2.Config): Fetch2.Request {
	const { url, params, body } = config
	let method: Fetch2.Method = 'get'
	let _url = prefix
	// let contentType = 'text/plain'
	let _body: NodeJS.fetch.RequestInit['body']

	if (url[_minMethodTextLength] === ':') {
		method = url.substring(0, _minMethodTextLength) as Fetch2.Method
		_url += url.substring(_minMethodTextLength + 1)
	} else {
		for (let i = _minMethodTextLength + 1; i < _maxMethodTextLength + 2; i++) {
			if (url[i] === ':') {
				method = url.substring(0, i) as Fetch2.Method
				_url += url.substring(i + 1)
				break
			}
		}

		if (_url.length === prefix.length) {
			_url += url
		}
	}

	if ((method === 'post' || method === 'put') && body != null) {
		if (body instanceof FormData) {
			// contentType = 'multipart/form-data'
			_body = body
		} else if (typeof body === 'object') {
			// contentType = 'application/json'
			try {
				_body = JSON.stringify(body) as NodeJS.fetch.RequestInit['body']
			} catch (err) {
				console.error(`${_url} body json stringify fail`, err)
				_body = `body type not JSON, check body please. ${String(
					body,
				)}` as NodeJS.fetch.RequestInit['body']
			}
		}
	}

	return {
		...config,
		method,
		url: _url,
		qs: params != null ? `?${queryString.stringify(params)}` : '',
		body: _body,
		headers: config.headers,
	}
}

const _transformRes = <R>(
	res: Fetch2.InterceptorResponse,
	responseUses: Fetch2.InterceptorUseResponseCallback[],
	markResolveList: ((result: any) => void)[] | null,
) => {
	let result = res as R

	if (responseUses.length > 0) {
		for (let i = 0; i < responseUses.length; i++) {
			result = responseUses[i](res)
		}
	}

	if (markResolveList != null) {
		for (let i = 1; i < markResolveList.length; i++) {
			markResolveList[i](result)
		}
	}

	return result
}

const _resetStatus = ({
	timoutInstance,

	mark,
	repeatMarkMap,

	controllerKey,
	controllerMap,
}: Fetch2.ResetStatusMap) => {
	if (timoutInstance != null) {
		clearTimeout(timoutInstance)
	}

	if (mark != null && repeatMarkMap[mark]?.length) {
		delete repeatMarkMap[mark]
	}

	if (controllerKey != null && controllerMap[controllerKey] != null) {
		delete controllerMap[controllerKey]
	}
}

// TODO retry, 競態
const createFetch2 = (options?: Fetch2.Options): Fetch2.Instance => {
	const { prefix = '', timeout = 0 } = options || {}
	const interceptors = {
		useRequest: null as Fetch2.InterceptorUseRequestCallback | null,
		useResponse: null as Fetch2.InterceptorUseResponseCallback | null,
		useError: null as Fetch2.InterceptorUseErrorCallback | null,
	}
	const cacheMap = {} as Fetch2.CacheMap
	const controllerMap = {} as Fetch2.ControllerMap
	const repeatMarkMap = {} as Fetch2.RepeatMarkMap

	const fetch2 = (async <R>(
		url: string,
		init?: Fetch2.RequestInit,
		apiOptions?: Fetch2.ApiOptions,
	) => {
		const resetMap: Fetch2.ResetStatusMap = {
			controllerMap,
			repeatMarkMap,
		}

		return await new Promise<{ __markResolve?: 1; response: Fetch2.InterceptorResponse }>(
			async (resolve, reject) => {
				try {
					let config: Fetch2.Config = {
						...init,
						url,
					}

					if (interceptors.useRequest) {
						config = interceptors.useRequest(config)
					}

					const {
						prefix: apiPrefix,
						controller: apiController,
						cacheTime,
						forceRun,
						mark,
						timeout: apiTimeout,
					} = apiOptions || {}
					const fetchConfig = _toRequest((apiPrefix == null ? prefix : apiPrefix) || '', config)
					const controllerKey = Symbol()
					let res = {} as Fetch2.InterceptorResponse
					let lastCacheTime = 0
					const cacheUrl = `${fetchConfig.method}:${fetchConfig.url}`
					let _timeout = apiTimeout || timeout

					resetMap.mark = (
						mark === true || (mark == null && fetchConfig.method === 'get')
							? cacheUrl
							: mark === false
							  ? null
							  : mark
					) as string | symbol | number
					resetMap.controllerKey = controllerKey

					if (_timeout > 0) {
						resetMap.timoutInstance = setTimeout(() => {
							reject(new Fetch2TimeoutError(`fetch timeout ${_timeout}ms`))
						}, _timeout)
					}

					if (resetMap.mark != null) {
						if (repeatMarkMap[resetMap.mark] != null) {
							repeatMarkMap[resetMap.mark].push(result => resolve(result))
						} else {
							repeatMarkMap[resetMap.mark] = [result => resolve(result)]
						}

						if (repeatMarkMap[resetMap.mark].length > 1) {
							return
						}
					}

					if (cacheMap[cacheUrl] == null) {
						if (cacheTime) {
							lastCacheTime = Date.now() + cacheTime
						}
					} else if (
						forceRun ||
						cacheMap[cacheUrl].lastCacheTime < Date.now() + (cacheTime || 0)
					) {
						delete cacheMap[cacheUrl]
					}

					if (cacheMap[cacheUrl] == null) {
						controllerMap[controllerKey] = apiController || new AbortController()
						fetchConfig.signal = controllerMap[controllerKey].signal

						try {
							let originRes = await fetch(fetchConfig.url + fetchConfig.qs, fetchConfig)

							res = originRes as unknown as Fetch2.InterceptorResponse

							if (lastCacheTime > 0) {
								cacheMap[cacheUrl] = {
									lastCacheTime,
									res,
								}
							}

							res.data = await res[config?.resType || 'json']()
						} catch (e) {
							if ((e as Error).name === 'AbortError') {
								throw new Fetch2AbortError('fetch abort')
							}
						} finally {
							res.config = fetchConfig as Fetch2.ResReq
							res.config.originBody = config.body
						}
					} else {
						res = cacheMap[cacheUrl].res
					}

					resolve({ response: res })
				} catch (err) {
					reject(
						err instanceof Fetch2AbortError || err instanceof Fetch2TimeoutError
							? err
							: err instanceof Error
							  ? Fetch2UnknownError.clone(err)
							  : new Fetch2UnknownError((err as Error)?.message || 'unknown'),
					)
				}
			},
		)
			.then(response => {
				if (response.__markResolve === 1) return response.response

				let result = response.response as R

				if (interceptors.useResponse != null) {
					result = interceptors.useResponse(response.response)
				}

				if (resetMap.mark != null && repeatMarkMap[resetMap.mark] != null) {
					for (let i = 1; i < repeatMarkMap[resetMap.mark].length; i++) {
						repeatMarkMap[resetMap.mark][i]({ __markResolve: 1, response: result })
					}
				}

				return result
			})
			.catch(error => {
				if (interceptors.useError != null) {
					return interceptors.useError(error, {
						url,
						init: init || null,
						apiOptions: apiOptions || null,
					})
				}

				throw error
			})
			.finally(() => {
				_resetStatus(resetMap)
			})
	}) as Fetch2.Instance

	fetch2.cancel = (controller: AbortController) => {
		controller.abort()
	}

	fetch2.cancelAll = () => {
		const names = Object.getOwnPropertySymbols(controllerMap)

		for (const name of names) {
			controllerMap[name]?.abort?.()
			delete controllerMap[name]
		}
	}

	fetch2.interceptors = {
		request: {
			use: callback => {
				interceptors.useRequest = callback
			},
		},
		response: {
			use: callback => {
				interceptors.useResponse = callback
			},
		},
		error: {
			use: callback => {
				interceptors.useError = callback
			},
		},
	}

	return fetch2
}

export { Fetch2AbortError, Fetch2TimeoutError, Fetch2UnknownError, createFetch2 }
