const code = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomString(length = 36) {
  let result = "";

  for (let i = 0; i < length; i++) {
    result += code.charAt(Math.floor(Math.random() * code.length));
  }

  return result;
}

export { randomString };
