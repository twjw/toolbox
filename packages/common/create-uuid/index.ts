// TODO 要改成同 uuid 格式
const ramdomCode1 = 'abcdefghijklmnopqrstuvwxyz0123456789'

function createRandomStr(length = 36) {
  let result = '';

  for (let i = 0; i < length; i++) {
    result += ramdomCode1.charAt(Math.floor(Math.random() * ramdomCode1.length));
  }

  return result;
}

const createUuid = () => {
  const nowString = Date.now().toString()
  const halfLength = Math.floor(nowString.length / 2)
  const mid = `-${nowString.substring(0, halfLength)}-${nowString.substring(halfLength + 1, nowString.length)}-`
  const lessLength = 36 - mid.length
  const firstLength = Math.floor(lessLength / 2)
  const lastLength = lessLength - firstLength

  return `${createRandomStr(firstLength)}${mid}${createRandomStr(lastLength)}`
}

export {
  createRandomStr,
  createUuid,
}
