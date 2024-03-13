import { tsFetch } from 'wtbx-type-safe-fetch'

const root = document.getElementById('root')!

root.innerHTML = 'hello wtbx-type-safe-fetch!'

const fetch1 = tsFetch
const fetch2 = tsFetch.create()

fetch1()
fetch1()
fetch2()
fetch2()
console.log(fetch1 === fetch2)
