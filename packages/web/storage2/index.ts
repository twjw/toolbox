enum Storage2TypeEnum {
  string,
  number,
  boolean,
  json,
}

type Storage2DefineResult<V, T extends Storage2TypeEnum> = {
  defaultValue: V
  type: T
  driver?: Storage
}

type Storage2PropState = Record<string, Storage2DefineResult<any, any>>

type FirstUppercase<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : never

type Storage2ConnectString<S1 extends string, S2 extends string> = `${S1}${FirstUppercase<S2>}`

type Storage2Define<Prefix extends string, State extends Storage2PropState> = {
  [K in keyof State]: Omit<State[K], 'driver'> & { driver: Storage, storageKey: K extends string ? Storage2ConnectString<Prefix, K> : never }
}

type Storage2State<State extends Storage2PropState> = {
  [K in keyof State]: State[K]['defaultValue']
}

class Storage2<Prefix extends string, State extends Storage2PropState> {
  private static defaultDriver: Storage = localStorage
  private static trueValues = ['1', 'True', 'true']
  private static emptyValues = ['', 'null', 'undefined']

  private define = {} as Storage2Define<Prefix, State>
  state = {} as Storage2State<State>

  constructor(prefix: Prefix, state: State, driver: Storage = Storage2.defaultDriver) {
    for (const k in state) {
      const e = state[k]

      if (e.driver == null) e.driver = driver
      ;(e as any).storageKey = `${prefix}${k[0].toUpperCase()}${k.substring(1) || ''}`
      this.define[k] = e as any

      this.state[k] = this.getStorageValue(k)
    }
  }

  static string(defaultValue: string, driver?: Storage): Storage2DefineResult<string, Storage2TypeEnum.string> {
    return {
      defaultValue,
      type: Storage2TypeEnum.string,
      driver,
    }
  }

  static number(defaultValue: number, driver?: Storage): Storage2DefineResult<number, Storage2TypeEnum.number> {
    return {
      defaultValue,
      type: Storage2TypeEnum.number,
      driver,
    }
  }

  static boolean(defaultValue: boolean, driver?: Storage): Storage2DefineResult<boolean, Storage2TypeEnum.boolean> {
    return {
      defaultValue,
      type: Storage2TypeEnum.boolean,
      driver,
    }
  }

  static json<T>(defaultValue: T, driver?: Storage): Storage2DefineResult<T, Storage2TypeEnum.json> {
    return {
      defaultValue,
      type: Storage2TypeEnum.json,
      driver,
    }
  }

  private setJsonValue<K extends keyof State>(define: Storage2Define<Prefix, State>[K], key: K, value: any) {
    if (value == null || Storage2.emptyValues.includes(value)) {
      this.remove(key)
    } else {
      try {
        define.driver.setItem(define.storageKey, JSON.stringify(value))
      } catch {
        this.remove(key)
      }
    }

    return value
  }

  private parseJsonValue<T>(value: string | null, defaultValue: T): T {
    if (value == null || Storage2.emptyValues.includes(value))
      return defaultValue

    try {
      const parse = JSON.parse(value)
      return parse as T
    } catch {}

    return defaultValue
  }

  private getStorageValue<K extends keyof State>(key: K): Storage2State<State>[K] {
    const currentDefine = this.define[key]
    const storageValue = currentDefine.driver.getItem(currentDefine.storageKey)

    if (storageValue == null && currentDefine.defaultValue != null) {
      this.update(key, currentDefine.defaultValue)
      return currentDefine.defaultValue
    }

    switch (currentDefine.type) {
      case Storage2TypeEnum.json:
        return this.parseJsonValue(storageValue, currentDefine.defaultValue)

      case Storage2TypeEnum.number:
        const n =  Number(storageValue)
        return isNaN(n) ? currentDefine.defaultValue : n

      case Storage2TypeEnum.string:
        return storageValue

      case Storage2TypeEnum.boolean:
        return storageValue == null ? currentDefine.defaultValue : Storage2.trueValues.includes(storageValue)
    }

    return currentDefine.defaultValue
  }

  update<K extends keyof State>(key: K, value: Storage2State<State>[K]): Storage2State<State>[K] {
    const currentDefine = this.define[key]

    switch (currentDefine.type) {
      case Storage2TypeEnum.json:
        this.setJsonValue(currentDefine, key, value)
        break

      case Storage2TypeEnum.number:
        currentDefine.driver.setItem(currentDefine.storageKey, String(value))
        break

      case Storage2TypeEnum.string:
        currentDefine.driver.setItem(currentDefine.storageKey, value as string)
        break

      case Storage2TypeEnum.boolean:
        currentDefine.driver.setItem(currentDefine.storageKey, value === true ? '1' : '0')
        break
    }


    return value
  }

  remove<K extends keyof State>(key: K): Storage2State<State>[K] {
    this.define[key].driver.removeItem(this.define[key].storageKey)
    return this.define[key].defaultValue
  }
}

export { Storage2, Storage2TypeEnum }
