/**
 * @param input {RequestInfo | URL}
 * @param [init=undefined] {RequestInit}
 * @return Promise<Response>
 */
function fetch2(input, init)  {
  return fetch(input, init)
}

export {
  fetch2,
}
