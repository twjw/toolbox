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

function _commonLog(prefix: string, type: LogType): CommonLogReturnFunction {
  const banners = [`%c${prefix ? `${prefix} ` : ''}${type.toUpperCase()}`] as any[]

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

  return function (this: Logs, ...args) {
    if (!this.isDebug) return;
    if (this.logLevel > typeLevel[type]) return;

    const d = new Date()
    const hms = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`

    if (banners.length) {
      console.log(...banners, hms, ...args);
    } else {
      console.log(hms, ...args);
    }
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

function createLog (prefix: string = '', isDebug: boolean = true) {
  return {
    prefix,
    isDebug,
		logLevel: 1,
		info: _commonLog(prefix, 'info'),
		success: _commonLog(prefix, 'success'),
		warn: _commonLog(prefix, 'warn'),
		error: _commonLog(prefix, 'error'),
		throw: throwError,
	} as Logs
}

export { createLog };
