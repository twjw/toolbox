import {wString} from "../../type";

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

type Storage2ConnectString<S1 extends string, S2 extends string> = `${S1}${wString.FirstUppercase<S2>}`

type Storage2Define<Prefix extends string, State extends Storage2PropState> = {
  [K in keyof State]: Omit<State[K], 'driver'> & { driver: Storage, storageKey: K extends string ? Storage2ConnectString<Prefix, K> : never }
}

type Storage2State<State extends Storage2PropState> = {
  [K in keyof State]: State[K]['defaultValue']
}

type Listener<State extends Storage2PropState> = (<K extends keyof State = keyof State, T = State[K]['defaultValue']>(key: K, value: T, prevValue: T) => void)

class Storage2<Prefix extends string, PropState extends Storage2PropState> {
  protected static defaultDriver: Storage = localStorage
  protected static trueValues = ['1', 'True', 'true']
  protected static emptyValues = ['', 'null', 'undefined']

  protected define = {} as Storage2Define<Prefix, PropState>
  protected listenerList = [] as Listener<PropState>[]
  state = {} as Storage2State<PropState>

  constructor(prefix: Prefix, state: PropState, driver: Storage = Storage2.defaultDriver) {
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

  protected setJsonValue<K extends keyof PropState>(define: Storage2Define<Prefix, PropState>[K], key: K, value: any) {
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

  protected parseJsonValue<T>(value: string | null, defaultValue: T): T {
    if (value == null || Storage2.emptyValues.includes(value))
      return defaultValue

    try {
      const parse = JSON.parse(value)
      return parse as T
    } catch {}

    return defaultValue
  }

  protected getStorageValue<K extends keyof PropState>(key: K): Storage2State<PropState>[K] {
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

  update<K extends keyof PropState>(key: K, value: Storage2State<PropState>[K], isPublish = true): Storage2State<PropState>[K] {
    const currentDefine = this.define[key]
    const tmpValue = this.state[key]

    switch (currentDefine.type) {
			case Storage2TypeEnum.json: {
				this.setJsonValue(currentDefine, key, value)
				break
			}

			case Storage2TypeEnum.number: {
				currentDefine.driver.setItem(currentDefine.storageKey, String(value))
				break
			}

			case Storage2TypeEnum.string: {
				currentDefine.driver.setItem(currentDefine.storageKey, value)
				break
			}

			case Storage2TypeEnum.boolean: {
				currentDefine.driver.setItem(currentDefine.storageKey, value === true ? '1' : '0')
				break
			}
		}

    this.state[key] = value

    if (isPublish && this.listenerList) {
      for (let i = 0; i < this.listenerList.length; i++) {
        this.listenerList[i](key, value, tmpValue)
      }
    }

    return value
  }

  remove<K extends keyof PropState>(key: K): Storage2State<PropState>[K] {
    this.define[key].driver.removeItem(this.define[key].storageKey)
    return this.define[key].defaultValue
  }

  subscribe(listener: Listener<PropState>) {
    this.listenerList.push((k, v, p) => {
      listener(k, v, p)
    })
  }
}

export type { Storage2PropState }
export { Storage2, Storage2TypeEnum }
