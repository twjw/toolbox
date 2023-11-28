const typeLevel = {
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
} as const;

type LogType = keyof typeof typeLevel

type CommonLogReturnFunction = (...args: any[]) => void

type Logs = {
  prefix: string,
  isDebug: boolean,
  logLevel: typeof typeLevel[keyof typeof typeLevel],
  info: CommonLogReturnFunction,
  success: CommonLogReturnFunction,
  warn: CommonLogReturnFunction,
  error: CommonLogReturnFunction,
  throw: (error: Error | string, ...args: any[]) => void,
}

function _commonLog(type: LogType): CommonLogReturnFunction {
  const banners: any[] = []

  return function (this: Logs, ...args) {
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

function throwError(this: Logs, error: Error | string, ...args: any[]) {
  if (!this.isDebug) return;

  if (args.length > 0) {
    this.error(...args);
  } else if (typeof error === "string") {
    this.error(error);
  }

  throw error;
}

const logs: Logs = {
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