const typeLevel = {
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
};

function _commonLog(type) {
  const banners = []

  return function (...args) {
    if (!this.isDebug) return;
    if (this.logLevel > typeLevel[type]) return;

    if (!banners.length) {
      const prefix = this.prefix ? `${this.prefix} ` : ''

      banners.push(`%c${prefix}${type.toUpperCase()}`)

      if (type === 'info') {
        banners.push(
          'border: 1px solid rgba(0, 0, 0, 0.7); border-radius: 4px; padding: 0 4px; background-color: rgba(0, 0, 0, 0.05);'
        )
      } else if (type === 'success') {
        banners.push(
          'border-radius: 4px; padding: 0 4px; background-color: green; color: #fff;'
        )
      } else if (type === 'warn') {
        banners.push(
          'border-radius: 4px; padding: 0 4px; background-color: orange; color: #fff;'
        )
      } else if (type === 'error') {
        banners.push(
          'border-radius: 4px; padding: 0 4px; background-color: red; color: #fff;'
        )
      }
    }

    const d = new Date()
    console.log(...banners, `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`, ...args);
  };
}

function throwError(error, ...args) {
  if (!this.isDebug) return;

  if (args.length > 0) {
    this.error(...args);
  } else if (typeof error === "string") {
    this.error(error);
  }

  throw error;
}

const logs = {
  prefix: 'LOG',
  isDebug: true,
  logLevel: 1,
  info: _commonLog("info"),
  success: _commonLog("success"),
  warn: _commonLog("warn"),
  error: _commonLog("error"),
  throw: throwError,
};

export { logs };
