const E_NAME = "__";

const enum2Types = {
  String: "",
  int: 1,
  boolean: true,
};

const createIncludes = (res) => {
  return (value, key) => {
    if (res == null) return false;

    let _key = key == null ? "value" : key;
    return res[_key]?.[value] != null;
  };
};

/**
 * 創建 enum
 * @type {<E extends Record<string, any>, VK extends Record<string, any>, M extends Record<string, any>>
 *     (enumMap: E, valKeyMap?: VK, methodMap?: M) => {
 *         keys: string[]
 *         values: any[]
 *         includes: (value: any) => boolean
 *     }
 *     & {
 *         [K in keyof E]: E[K] extends any[] ? E[K][0] : E[K]
 *     }
 *     & (VK extends Record<string, any>
 *         ? {
 *             [K in keyof VK]: Record<string, any>
 *         }
 *         : {})
 *     & (M extends Record<string, any>
 *         ? {
 *             [K in keyof M]: M[K]
 *         }
 *         : {})}
 */
const enum2 = (enumMap, valKeyMap, methodMap) => {
  if (enumMap == null) return {};

  const keys = [];
  const valKeyList = valKeyMap == null ? [] : Object.keys(valKeyMap);
  const res = {
    keys,
    values: [],
  };

  for (let k in enumMap) {
    const values = enumMap[k];
    let value;

    if (Array.isArray(values)) {
      value = values[0] === E_NAME ? k : values[0];

      for (let i = 0; i < values.length; i++) {
        const groupName = valKeyList[i];

        if (groupName == null) break;

        if (res[groupName] == null) {
          res[groupName] = { [value]: values[i] };
        } else {
          res[groupName][value] = values[i];
        }
      }
    } else {
      value = values === E_NAME ? k : values;
    }

    res[k] = value;
    if (res.value == null) {
      res.value = { [value]: value };
    } else {
      res.value[value] = value;
    }
    res.values.push(value);
    keys.push(k);
  }

  res.includes = createIncludes(res);

  if (methodMap != null) {
    for (const name in methodMap) {
      res[name] = methodMap[name].bind(res);
    }
  }

  return res;
};

export { enum2, enum2Types, E_NAME };
