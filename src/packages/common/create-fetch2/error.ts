class _Fetch2BaseError extends Error {
	static clone(err: Error) {
		const self = new this()
		self.message = err.message
		self.name = this.name
		self.stack = err.stack
		return self
	}
}

class Fetch2AbortError extends _Fetch2BaseError {}

class Fetch2TimeoutError extends _Fetch2BaseError {}

class Fetch2UnknownError extends _Fetch2BaseError {}

export { Fetch2AbortError, Fetch2TimeoutError, Fetch2UnknownError }
