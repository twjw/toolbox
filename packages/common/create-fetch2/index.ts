import queryString from 'query-string'
import { Fetch2 } from './type'
import { Fetch2AbortError, Fetch2TimeoutError, Fetch2UnknownError } from './error'

const _maxMethodTextLength = 'delete'.length - 1
const _minMethodTextLength = 'get'.length - 1

function _toRequest(config: Fetch2.Config): Fetch2.Request {
	const { url, prefix = '', pathParams, params, body } = config
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

	if (pathParams != null) {
		const urls = _url.split('/')
		for (let i = 1; i < urls.length; i++) {
			if (urls[i][0] === ':') {
				urls[i] = pathParams[urls[i].substring(1)] || [urls[i]]
			}
		}
		_url = urls.join('/')
	}

	if (params != null) {
		_url += `?${queryString.stringify(params)}`
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
		} else if (typeof body === 'string') {
			_body = body
		}
	}

	return {
		...config,
		method,
		url: _url,
		body: _body,
		headers: config.headers,
	}
}

// TODO retry, 競態
const createFetch2 = (options: Fetch2.Options = {}): Fetch2.Instance => {
	const { prefix = '', timeout = 0 } = options
	const interceptors = {
		useRequest: null as Fetch2.InterceptorUseRequestCallback | null,
		useResponse: null as Fetch2.InterceptorUseResponseCallback | null,
		useError: null as Fetch2.InterceptorUseErrorCallback | null,
	}
	const cacheMap = {} as Fetch2.CacheMap
	const controllerMap = {} as Fetch2.ControllerMap
	const repeatMarkMap = {} as Fetch2.RepeatMarkMap
	let id = 0

	const fetch2 = (async <R>(
		url: string,
		init?: Fetch2.RequestInit,
		apiOptions: Fetch2.ApiOptions = {},
	) => {
		const fetchId = ++id
		let timoutInstance: NodeJS.Timeout | undefined
		let mark: symbol | string | number | undefined

		return new Promise<{ __markResolve?: 1; response: Fetch2.InterceptorResponse }>(
			async (resolve, reject) => {
				try {
					let config: Fetch2.Config = {
						...options,
						...apiOptions,
						...init,
						url,
					}

					if (interceptors.useRequest) {
						config = interceptors.useRequest(config)
					}

					const fetchConfig = _toRequest(config)
					let res = {} as Fetch2.InterceptorResponse
					let lastCacheTime = 0
					const cacheUrl = `${fetchConfig.method}:${fetchConfig.url}`

					mark = (
						config.mark === true || (config.mark == null && fetchConfig.method === 'get')
							? cacheUrl
							: config.mark === false
							  ? null
							  : config.mark
					) as string | symbol | number

					if (config.timeout != null && config.timeout > 0) {
						timoutInstance = setTimeout(() => {
							reject(new Fetch2TimeoutError(`fetch timeout ${config.timeout}ms`))
						}, config.timeout)
					}

					if (mark != null) {
						if (repeatMarkMap[mark] != null) {
							repeatMarkMap[mark].push([resolve, reject])
						} else {
							repeatMarkMap[mark] = [[resolve, reject]]
						}

						if (repeatMarkMap[mark].length > 1) {
							return
						}
					}

					if (cacheMap[cacheUrl] == null) {
						if (config.cacheTime) {
							lastCacheTime = Date.now() + config.cacheTime
						}
					} else if (
						config.forceRun ||
						cacheMap[cacheUrl].lastCacheTime < Date.now() + (config.cacheTime || 0)
					) {
						delete cacheMap[cacheUrl]
					}

					if (cacheMap[cacheUrl] == null) {
						controllerMap[fetchId] = apiOptions.controller || new AbortController()
						fetchConfig.signal = controllerMap[fetchId].signal

						try {
							let originRes = await fetch(fetchConfig.url, fetchConfig)

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

				if (mark != null && repeatMarkMap[mark] != null) {
					for (let i = 1; i < repeatMarkMap[mark].length; i++) {
						repeatMarkMap[mark][i][0]({ __markResolve: 1, response: result })
					}

					delete repeatMarkMap[mark]
				}

				return result
			})
			.catch(error => {
				if (error.__markReject === 1) {
					if (error.__response != null) return error.__response
					throw error.__error
				}

				let result: any

				if (interceptors.useError != null) {
					result = interceptors.useError(error, {
						url,
						init: init || null,
						apiOptions: apiOptions || null,
					})
				}

				if (mark != null && repeatMarkMap[mark] != null) {
					for (let i = 1; i < repeatMarkMap[mark].length; i++) {
						repeatMarkMap[mark][i][1]({ __markReject: 1, __response: result, __error: error })
					}

					delete repeatMarkMap[mark]
				}

				if (result != null) return result

				throw error
			})
			.finally(() => {
				if (timoutInstance != null) {
					clearTimeout(timoutInstance)
				}

				if (controllerMap[fetchId] != null) {
					delete controllerMap[fetchId]
				}
			})
	}) as Fetch2.Instance

	fetch2.cancel = (controller: AbortController) => {
		controller.abort()
	}

	fetch2.cancelAll = () => {
		for (const fetchId in controllerMap) {
			controllerMap[fetchId].abort()
			delete controllerMap[fetchId]
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
