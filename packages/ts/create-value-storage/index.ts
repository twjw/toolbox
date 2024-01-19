const emptyTexts = ['undefined', 'null']

function createValueStorage<T>(
  key: string,
  defaultValue: T,
  storage: Storage = localStorage,
  ignoreEmptyText = true,
) {
  const getItem = () => _getItem(storage, key, defaultValue, ignoreEmptyText) as T

  return {
    defaultValue: getItem(),
    getItem,
    setItem: (value: T) => _setItem(storage, key, value, ignoreEmptyText),
    removeItem: () => storage.removeItem(key),
  }
}

function _getItem<T>(storage: Storage, key: string, defaultValue: T, ignoreEmptyText = true) {
  const value = storage.getItem(key)

  if (value == null) return defaultValue
  if (ignoreEmptyText && emptyTexts.includes(value)) return defaultValue

  try {
    return JSON.parse(value)
  } catch {
    return defaultValue
  }
}

function _setItem(storage: Storage, key: string, value: any, ignoreEmptyText = true) {
  if (value == null) {
    storage.removeItem(key)
    return
  }

  try {
    const stringifyValue = JSON.stringify(value)

    if (ignoreEmptyText && emptyTexts.includes(stringifyValue)) {
      storage.removeItem(key)
      return
    }

    storage.setItem(key, stringifyValue)
  } catch {
    storage.removeItem(key)
  }
}

export { createValueStorage }
