import { Fragment, jsx as jsx_, jsxs as jsxs_ } from 'react/jsx-runtime'
import { newJsx } from '../utils.js'

const map = {}
const jsx = newJsx(jsx_, map)
const jsxs = newJsx(jsxs_, map)

export { Fragment, jsx, jsxs, map }
