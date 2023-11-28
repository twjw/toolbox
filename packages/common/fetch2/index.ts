function fetch2(input: NodeJS.fetch.RequestInfo, init?: RequestInit): Promise<Response>  {
  return fetch(input, init)
}

export {
  fetch2,
}
