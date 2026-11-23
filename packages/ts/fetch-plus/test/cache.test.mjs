import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createFetchPlus, FetchPlusAbortError } from '../dist/index.js'

const originalFetch = globalThis.fetch
const url = 'post:/activity-api/activity/home'
const cacheOptions = { cacheTime: Number.MAX_SAFE_INTEGER }
const response = (status, data = { code: String(status) }) => ({
	status,
	ok: status >= 200 && status < 300,
	json: async () => data,
})

afterEach(() => {
	globalThis.fetch = originalFetch
})

for (const status of [403, 500, 600, 606]) {
	test(`HTTP ${status} is not cached or replayed after login`, async () => {
		let calls = 0
		let sid = 'old-session'
		const failures = []
		globalThis.fetch = async () => response(++calls === 1 ? status : 200)
		const client = createFetchPlus()
		client.interceptors.request.use(config => ({ ...config, headers: { SID: sid } }))
		client.interceptors.response.use(res => {
			if (!res.ok) {
				failures.push(res.config.headers.SID)
				client.cancelAll()
			}
			return { status: res.status, data: res.data }
		})

		assert.equal((await client(url, undefined, cacheOptions)).status, status)
		sid = 'new-session'
		assert.equal((await client(url, undefined, { ...cacheOptions, mutate: false })).status, 200)
		assert.equal(calls, 2)
		assert.deepEqual(failures, ['old-session'])
	})
}

test('successful responses stay cached and still run response interceptors', async () => {
	let calls = 0
	let intercepted = 0
	globalThis.fetch = async () => {
		calls++
		return response(200, { value: calls })
	}
	const client = createFetchPlus()
	client.interceptors.response.use(res => {
		intercepted++
		return res.data
	})
	assert.deepEqual(await client(url, undefined, cacheOptions), { value: 1 })
	assert.deepEqual(await client(url, undefined, cacheOptions), { value: 1 })
	assert.equal(calls, 1)
	assert.equal(intercepted, 2)
	assert.deepEqual(await client(url, undefined, { ...cacheOptions, mutate: true }), {
		value: 2,
	})
	assert.deepEqual(await client(url, undefined, cacheOptions), { value: 2 })
	assert.equal(calls, 2)
})

test('body parsing failures do not leave incomplete cache entries', async () => {
	let calls = 0
	globalThis.fetch = async () => {
		calls++
		if (calls === 1) {
			return {
				...response(200),
				json: async () => {
					throw new SyntaxError('Invalid JSON')
				},
			}
		}
		return response(200, { recovered: true })
	}
	const client = createFetchPlus()
	// Preserve the existing parse-error return behavior; only cache handling changes.
	await client(url, undefined, cacheOptions)
	assert.deepEqual((await client(url, undefined, cacheOptions)).data, { recovered: true })
	assert.equal(calls, 2)
})

test('cancel during body parsing does not leave a cached response', async () => {
	let calls = 0
	let parsingStarted
	const started = new Promise(resolve => {
		parsingStarted = resolve
	})
	globalThis.fetch = async (_url, config) => {
		calls++
		if (calls > 1) return response(200, { recovered: true })
		return {
			...response(200),
			json: () =>
				new Promise((_resolve, reject) => {
					config.signal.addEventListener(
						'abort',
						() => {
							reject(new DOMException('Aborted', 'AbortError'))
						},
						{ once: true },
					)
					parsingStarted()
				}),
		}
	}
	const client = createFetchPlus()
	const pending = client(url, undefined, cacheOptions)
	await started
	client.cancelAll()
	await assert.rejects(pending, FetchPlusAbortError)
	assert.deepEqual((await client(url, undefined, cacheOptions)).data, { recovered: true })
	assert.equal(calls, 2)
})

test('concurrent calls remain deduplicated and a failed response is retried', async () => {
	let calls = 0
	let release
	const gate = new Promise(resolve => {
		release = resolve
	})
	globalThis.fetch = async () => {
		const status = ++calls === 1 ? 606 : 200
		await gate
		return response(status)
	}
	const client = createFetchPlus()
	const first = client(url, undefined, cacheOptions)
	const second = client(url, undefined, cacheOptions)
	release()
	const results = await Promise.all([first, second])
	assert.deepEqual(
		results.map(res => res.status),
		[606, 606],
	)
	assert.equal(calls, 1)
	assert.equal((await client(url, undefined, cacheOptions)).status, 200)
	assert.equal(calls, 2)
})
