// (input: NodeJS.fetch.RequestInfo, init?: RequestInit): Promise<Response>

type BaseFetchOptions = {
  prefix?: string
}

class BaseFetch  {
  constructor(options?: BaseFetchOptions) {
    const { prefix = '' } = options || {}
  }

  private request() {}

  base(input: NodeJS.fetch.RequestInfo, init?: RequestInit) {
    return fetch(input, init)
  }

  get() {}

  post() {}

  put() {}

  delete() {}
}

export {
  BaseFetch,
}
