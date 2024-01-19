function waitMs(timeout = 1000) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

export { waitMs }
